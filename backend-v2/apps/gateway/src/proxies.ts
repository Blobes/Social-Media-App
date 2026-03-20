import { Router } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";

const router: Router = Router();

// Internal Render URLs (from render.yaml hostport)
const AUTH_URL = `http://${process.env.AUTH_SERVICE_URL}`;
const POST_URL = `http://${process.env.POST_SERVICE_URL}`;
const USER_URL = `http://${process.env.USER_SERVICE_URL}`;
const WORKER_URL = `http://${process.env.WORKER_SERVICE_URL}`;
const ADMIN_URL = `http://${process.env.ADMIN_SERVICE_URL}`;

const proxyOptions: Options = {
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      // Logic to run before request is sent (optional)
    },
    error: (err, req, res) => {
      console.error(`[Proxy Error]: ${err.message}`);
      // Use standard type assertion if TypeScript complains about the res type
      (res as any).status(502).json({
        error: "Bad Gateway",
        message: "The requested service is currently unavailable or waking up.",
      });
    },
  },
};

// --- Route Mapping with Path Rewrites ---
// Handles: api.funstakes.net/auth -> funstakes-auth:8080/
router.use(
  "/auth",
  createProxyMiddleware({
    ...proxyOptions,
    target: AUTH_URL,
    pathRewrite: { "^/auth": "" },
  }),
);

// Handles: api.funstakes.net/post -> funstakes-post:8081/
router.use(
  "/post",
  createProxyMiddleware({
    ...proxyOptions,
    target: POST_URL,
    pathRewrite: { "^/post": "" },
  }),
);

// Handles: api.funstakes.net/user -> funstakes-user:8082/
router.use(
  "/user",
  createProxyMiddleware({
    ...proxyOptions,
    target: USER_URL,
    pathRewrite: { "^/user": "" },
  }),
);

// Handles: api.funstakes.net/worker -> funstakes-worker:8083/
router.use(
  "/worker",
  createProxyMiddleware({
    ...proxyOptions,
    target: WORKER_URL,
    pathRewrite: { "^/worker": "" },
  }),
);

// Handles: api.funstakes.net/admin -> funstakes-admin:8084/
router.use(
  "/admin",
  createProxyMiddleware({
    ...proxyOptions,
    target: ADMIN_URL,
    pathRewrite: { "^/admin": "" },
  }),
);

export default router;
