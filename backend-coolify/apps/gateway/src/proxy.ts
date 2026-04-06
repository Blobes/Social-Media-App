import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const router: Router = Router();

/**
 * Clean Proxy Factory
 * Just forwards the request and handles 502/504 errors gracefully.
 * * @param targetEnvVar - The target service URL from process.env
 */
const proxyHandler = (
  prefixes: string[],
  targetEnvVar: string,
  shouldStrip: boolean = false,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const target = process.env[targetEnvVar];

    if (!target) {
      console.error(`❌ [Proxy Error] ${targetEnvVar} is undefined!`);
      return res.status(502).json({ error: `Config missing: ${targetEnvVar}` });
    }

    const matchedPrefix = prefixes.find((p) => req.path.startsWith(p));
    if (!matchedPrefix) return next();

    // Create and execute the middleware on the fly
    return createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: shouldStrip ? { [`^${matchedPrefix}`]: "" } : undefined,
      secure: true,
      xfwd: true,
      on: {
        error: (err, req, res) => {
          console.error(`[Proxy Error] ${targetEnvVar}:`, err.message);
          (res as Response).status(502).json({ error: "Service unavailable" });
        },
      },
    })(req, res, next);
  };
};

// --- Route Mapping ---

// ACCOUNT SERVICE: (Strip '/account', keep '/auth' and '/user')
router.use(proxyHandler(["/account"], "ACCOUNT_URL", true));
router.use(proxyHandler(["/auth", "/user"], "ACCOUNT_URL"));

// POST SERVICE: (Strip '/post', keep '/feed' and '/gists')
router.use(proxyHandler(["/post"], "POST_URL", true));
router.use(proxyHandler(["/feed", "/gists"], "POST_URL"));

// ADMIN SERVICE
router.use(proxyHandler(["/admin"], "ADMIN_URL", true));

// WORKER SERVICE
router.use(proxyHandler(["/worker"], "WORKER_URL", true));

export default router;
