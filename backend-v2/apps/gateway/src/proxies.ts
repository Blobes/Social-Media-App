import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const router: Router = Router();

// These now come directly from the render.yaml injection
const AUTH_URL = `http://${process.env.AUTH_SERVICE_URL}`;
const POST_URL = `http://${process.env.POST_SERVICE_URL}`;
const USER_URL = `http://${process.env.USER_SERVICE_URL}`;
const WORKER_URL = `http://${process.env.WORKER_SERVICE_URL}`;
const ADMIN_URL = `http://${process.env.ADMIN_SERVICE_URL}`;

const proxyOptions = {
  changeOrigin: true,
  onError: (err: any, req: any, res: any) => {
    res.status(500).json({ error: "Proxy Error", message: err.message });
  },
};

// Route mapping
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
