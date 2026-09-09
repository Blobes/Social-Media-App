import { IInternalTokenConfig } from "@repo/shared";
import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Validates the internal synchronization bearer token to secure asset uploads.
 */
export const verifyInternalAuth = (
  config: IInternalTokenConfig,
): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<any> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        status: "ERROR",
        message: "Unauthorized: Missing synchronization token.",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    const serverSecret = config.INTERNAL_TOKEN_SECRET;

    // Prevent matching fallback tokens in production deployments
    if (!serverSecret || serverSecret === "DEVELOPMENT_FALLBACK_TOKEN") {
      res.status(500).json({
        status: "ERROR",
        message: "Internal configuration mismatch: Sync secret token is unset.",
      });
      return;
    }

    if (token !== serverSecret) {
      res.status(403).json({
        status: "ERROR",
        message: "Forbidden: Invalid synchronization signature token.",
      });
      return;
    }

    next();
  };
};
