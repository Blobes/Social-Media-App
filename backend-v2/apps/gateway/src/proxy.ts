import type { IncomingMessage } from "http";
import { Router, Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const router: Router = Router();

/**
 * Handles proxy connection errors and prevents the Gateway from crashing.
 */
const handleProxyError = (
  err: any,
  req: Request,
  res: Response,
  envVarName: string,
) => {
  console.error(`[Proxy Error] Failed to reach ${envVarName}:`, err.message);
  res.status(502).json({ error: "Service Unavailable", target: envVarName });
};

/**
 * Proxy Handler
 * @param prefixes - Array of paths to match (e.g., ["/auth", "/user"] or ["/admin"])
 * @param envVarName - The target service URL from process.env
 * @param shouldStrip - Whether to remove the prefix before forwarding to the service
 */
export const proxyService = (
  prefixes: string[],
  envVarName: string,
  shouldStrip: boolean = false,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const target = process.env[envVarName];
    if (!target)
      return res.status(500).json({ error: `Config missing: ${envVarName}` });

    // Check if the current request path matches any of our prefixes
    const matchedPrefix = prefixes.find((p) => req.path.startsWith(p));
    if (!matchedPrefix) return next();

    return createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: true,
      xfwd: true,
      pathRewrite: shouldStrip ? { [`^${matchedPrefix}`]: "" } : undefined,
      on: {
        proxyReq: (proxyReq, req: any) => {
          console.log(
            `[Gateway] Proxying ${req.originalUrl} -> ${target}${proxyReq.path}`,
          );
        },
        error: (err, req, res) =>
          handleProxyError(err, req as any, res as Response, envVarName),
      },
    })(req, res, next);
  };
};

// --- Standardized Route Mapping ---

// ACCOUNT SERVICE
router.use(proxyService(["/account"], "ACCOUNT_URL", true));
router.use(proxyService(["/auth", "/user"], "ACCOUNT_URL", false));

// POST SERVICE
router.use(proxyService(["/post"], "POST_URL", true));
router.use(proxyService(["/feed", "/gists"], "POST_URL", false));

// ADMIN SERVICE
router.use(proxyService(["/admin"], "ADMIN_URL", true));

// WORKER SERVICE
router.use(proxyService(["/worker"], "WORKER_URL", true));

export default router;
