import { Router, type Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { Socket } from "net";

const router: Router = Router();

/**
 * Clean Proxy Factory
 * Just forwards the request and handles 502/504 errors gracefully.
 */
const createServiceProxy = (targetEnvVar: string, rewritePath?: string) => {
  const target = process.env[targetEnvVar];

  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: rewritePath ? { [`^${rewritePath}`]: "" } : undefined,
    on: {
      error: (err, req, res) => {
        console.error(`[Proxy Error] ${targetEnvVar}:`, err.message);
        if (res instanceof Socket) {
          res.destroy();
          return;
        }
        const out = res as Response;
        if (!out.headersSent) {
          out.status(502).json({ error: "Service temporarily unavailable" });
        }
      },
    },
  });
};

// --- Route Mapping ---

// ACCOUNT SERVICE: (Strip '/account', keep '/auth' and '/user')
router.use("/account", createServiceProxy("ACCOUNT_URL", "/account"));
router.use(["/auth", "/user"], createServiceProxy("ACCOUNT_URL"));

// POST SERVICE: (Strip '/post', keep '/feed' and '/gists')
router.use("/post", createServiceProxy("POST_URL", "/post"));
router.use(["/feed", "/gists"], createServiceProxy("POST_URL"));

// ADMIN SERVICE
router.use("/admin", createServiceProxy("ADMIN_URL", "/admin"));

// WORKER SERVICE
router.use("/worker", createServiceProxy("WORKER_URL", "/worker"));

export default router;
