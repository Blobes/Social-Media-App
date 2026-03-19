// apps/gateway/src/routes.ts
import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const router: Router = Router();

// Use the Service Name defined in Render + the Port your app listens on
const AUTH_URL = "http://funstakes-auth:8080";
const POST_URL = "http://funstakes-post:8081";
const USER_URL = "http://funstakes-user:8082";
const WORKER_URL = "http://funstakes-worker:8083";
const ADMIN_URL = "http://funstakes-admin:8084";

const proxyOptions = {
  changeOrigin: true,
  // This helps catch errors so the whole gateway doesn't crash
  onError: (err: any, req: any, res: any) => {
    res.status(500).json({ error: "Proxy Error", message: err.message });
  },
};

router.use(
  "/auth",
  createProxyMiddleware({ ...proxyOptions, target: AUTH_URL }),
);
router.use(
  "/post",
  createProxyMiddleware({ ...proxyOptions, target: POST_URL }),
);
router.use(
  "/user",
  createProxyMiddleware({ ...proxyOptions, target: USER_URL }),
);
router.use(
  "/worker",
  createProxyMiddleware({ ...proxyOptions, target: WORKER_URL }),
);
router.use(
  "/admin",
  createProxyMiddleware({ ...proxyOptions, target: ADMIN_URL }),
);

export default router;
