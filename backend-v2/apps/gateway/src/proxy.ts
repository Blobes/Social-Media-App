import { Router, Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { pingServices } from "./middleware/pinger";
import { isServiceAwake } from "./middleware/checkService";

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
  console.error(`[Proxy Error] ${envVarName} is likely sleeping:`, err.message);

  res.status(202).json({
    error: "Service warming up",
    message: "The service is starting. Please retry in 20 seconds.",
    retryable: true,
  });
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
  return async (req: Request, res: Response, next: NextFunction) => {
    const target = process.env[envVarName] as string;
    if (!target)
      return res.status(500).json({ error: `Config missing: ${envVarName}` });

    const matchedPrefix = prefixes.find((p) => req.path.startsWith(p));
    if (!matchedPrefix) return next();

    // --- NEW: THE PRE-FLIGHT CHECK ---
    const awake = await isServiceAwake(target);

    if (!awake) {
      console.log(`[Gateway] ${envVarName} is sleeping. Preventing 502...`);
      // Trigger the background wake-up for ALL services (your existing logic)
      pingServices();
      // Return 202 to the user to keep the connection "healthy"
      return res.status(202).json({
        status: "warming_up",
        message: "Service is starting. Please refresh in 30 seconds.",
        target: envVarName,
      });
    }

    // IF AWAKE: Hand over to the existing Proxy Middleware
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

// export const proxyService = (
//   prefixes: string[],
//   envVarName: string,
//   shouldStrip: boolean = false,
// ) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     const target = process.env[envVarName];
//     if (!target)
//       return res.status(500).json({ error: `Config missing: ${envVarName}` });

//     // Check if the current request path matches any of our prefixes
//     const matchedPrefix = prefixes.find((p) => req.path.startsWith(p));
//     if (!matchedPrefix) return next();

//     return createProxyMiddleware({
//       target,
//       changeOrigin: true,
//       secure: true,
//       timeout: 120000,
//       proxyTimeout: 120000,
//       xfwd: true,
//       pathRewrite: shouldStrip ? { [`^${matchedPrefix}`]: "" } : undefined,
//       on: {
//         proxyReq: (proxyReq, req: any) => {
//           console.log(
//             `[Gateway] Proxying ${req.originalUrl} -> ${target}${proxyReq.path}`,
//           );
//         },
//         error: (err, req, res) =>
//           handleProxyError(err, req as any, res as Response, envVarName),
//       },
//     })(req, res, next);
//   };
// };

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
