import { Router } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";

const router: Router = Router();

// Using Public onrender.com URLs to bypass Free Tier private networking restrictions
const AUTH_URL = "https://funstakes-auth.onrender.com";
const POST_URL = "https://funstakes-post.onrender.com";
const USER_URL = "https://funstakes-user.onrender.com";
const WORKER_URL = "https://funstakes-worker.onrender.com";
const ADMIN_URL = "https://funstakes-admin.onrender.com";

const proxyOptions: Options = {
  changeOrigin: true, // Required when proxying to a different public domain
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
