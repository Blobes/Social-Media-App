import { Router, Request, Response, NextFunction } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";

const router: Router = Router();

/**
 * Global Proxy Configuration.
 * Note: We don't define the 'target' here because it
 * needs to be read from process.env at runtime.
 */
const proxyOptions: Options = {
  changeOrigin: true,
  proxyTimeout: 60000,
  timeout: 60000,
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
 * REUSABLE ERROR HANDLER:
 * Detects if a service is "cold" and retries the request until it wakes up.
 */
const handleProxyError = (
  err: any,
  req: any,
  res: Response,
  envVarName: string,
  pathPattern: string,
) => {
  const target = process.env[envVarName];
  const isRetryable = ["ECONNREFUSED", "ETIMEDOUT", "ECONNRESET"].includes(
    err.code,
  );

  // Track retries on the request object to avoid infinite loops
  req.retryCount = (req.retryCount || 0) + 1;

  // Retry every 3 seconds, up to 15 times (~45 seconds total window for Render boot)
  if (isRetryable && req.retryCount <= 15) {
    console.log(
      `[Proxy] ${envVarName} is cold. Retrying ${req.retryCount}/15...`,
    );
    return setTimeout(() => {
      const retryProxy = createProxyMiddleware({
        changeOrigin: true,
        proxyTimeout: 90000,
        timeout: 90000,
        target,
        pathRewrite: { [`^${pathPattern}`]: "" },
        // Recursively call the same error handler if it fails again
        on: {
          error: (err, req, res) =>
            handleProxyError(err, req, res as any, envVarName, pathPattern),
        },
      });
      retryProxy(req, res as any, () => {});
    }, 3000);
  }
  // Final failure if the service doesn't wake up after 15 attempts
  console.error(`[Proxy Fatal Error] ${envVarName}: ${err.message}`);
  res.status(502).json({
    error: "Bad Gateway",
    service: envVarName.replace("_URL", "").toLowerCase(),
    message:
      "The service failed to wake up in time. Please refresh in a moment.",
  });
};

/**
 * Dynamic Proxy Wrapper
 * This function creates the proxy only when the request hits the route,
 * ensuring process.env values are fully loaded.
 */
const proxyTo = (envVarName: string, pathPattern: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const target = process.env[envVarName];
    if (!target)
      return res.status(500).json({ error: `Config missing: ${envVarName}` });

    return createProxyMiddleware({
      target,
      changeOrigin: true,
      proxyTimeout: 90000,
      timeout: 90000,
      pathRewrite: { [`^${pathPattern}`]: "" },
      on: {
        error: (err, req, res) =>
          handleProxyError(err, req, res as any, envVarName, pathPattern),
      },
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
