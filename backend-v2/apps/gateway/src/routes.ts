import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const router: Router = Router();

// Internal Render Hostnames
const AUTH_URL = "https://funstakes-auth.onrender.com:8080";
const POST_URL = "https://funstakes-post.onrender.com:8081";
const USER_URL = "https://funstakes-user.onrender.com:8082";
const WORKER_URL = "https://funstakes-worker.onrender.com:8083";
const ADMIN_URL = "https://funstakes-admin.onrender.com:8084";

// Auth Routing
router.use(
  "/auth",
  createProxyMiddleware({
    target: AUTH_URL,
    changeOrigin: true,
  }),
);

// Post Routing
router.use(
  "/post",
  createProxyMiddleware({
    target: POST_URL,
    changeOrigin: true,
  }),
);

// User Routing
router.use(
  "/user",
  createProxyMiddleware({
    target: USER_URL,
    changeOrigin: true,
  }),
);

// Worker Routing
router.use(
  "/worker",
  createProxyMiddleware({
    target: WORKER_URL,
    changeOrigin: true,
  }),
);

// Admin Routing
router.use(
  "/admin",
  createProxyMiddleware({
    target: ADMIN_URL,
    changeOrigin: true,
  }),
);

// Media Routing
router.use(
  "/media",
  createProxyMiddleware({
    target: "https://funstakes-user.onrender.com:8082",
    changeOrigin: true,
    pathRewrite: {
      "^/media": "/media",
    },
  }),
);

// Report Routing
router.use(
  "/report",
  createProxyMiddleware({
    target: "https://funstakes-admin.onrender.com:8084",
    changeOrigin: true,
    pathRewrite: {
      "^/report": "/report",
    },
  }),
);

export default router;
