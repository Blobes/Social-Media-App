import { Router, Request, Response, NextFunction } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";

const router: Router = Router();

/**
 * Global Proxy Configuration
 * Note: We don't define the 'target' here because it
 * needs to be read from process.env at runtime.
 */
const proxyOptions: Options = {
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      // Logic to run before request is sent
    },
    error: (err: any, req, res) => {
      console.error(`[Proxy Error]: ${err.message}`);
      (res as any).status(502).json({
        error: "Bad Gateway",
        debug_code: err.code,
        message:
          "The service is currently waking up or unavailable. Please retry in 30 seconds.",
      });
    },
  },
};

/**
 * Dynamic Proxy Wrapper
 * This function creates the proxy only when the request hits the route,
 * ensuring process.env values are fully loaded.
 */
const proxyTo = (envVarName: string, pathPattern: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const target = process.env[envVarName];

    if (!target) {
      console.error(
        `[Config Error]: ${envVarName} is not defined in environment.`,
      );
      return res
        .status(500)
        .json({ error: "Internal Server Configuration Error" });
    }
    return createProxyMiddleware({
      ...proxyOptions,
      target: target,
      pathRewrite: { [`^${pathPattern}`]: "" },
    })(req, res, next);
  };
};

// --- Route Mapping ---
// Handles: api.funstakes.net/auth
router.use("/auth", proxyTo("AUTH_URL", "/auth"));

// Handles: api.funstakes.net/post
router.use("/post", proxyTo("POST_URL", "/post"));

// Handles: api.funstakes.net/user
router.use("/user", proxyTo("USER_URL", "/user"));

// Handles: api.funstakes.net/worker
router.use("/worker", proxyTo("WORKER_URL", "/worker"));

// Handles: api.funstakes.net/admin
router.use("/admin", proxyTo("ADMIN_URL", "/admin"));

export default router;
