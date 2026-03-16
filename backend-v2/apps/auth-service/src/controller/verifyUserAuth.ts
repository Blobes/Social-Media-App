import { UserModel } from "@repo/database";
import { AuthRequest, userSensitiveFields } from "@repo/shared";
import { RequestHandler, Response } from "express";

export const verifyUserAuth: RequestHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      status: "ERROR",
      message: "Invalid or expired token",
      payload: null,
    });
    return;
  }

  try {
    // findById respects the global pre('find') middleware.
    // If the user is deactivated, this will return null.
    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(401).json({
        status: "ERROR",
        message: "User account not found or deactivated",
        payload: null,
      });
      return;
    }

    // Convert to plain object for cleaning
    const safePayload = user.toObject();

    // Use the helper to strip all internal/security fields
    userSensitiveFields().forEach((field) => {
      delete (safePayload as any)[field];
    });

    // Success response
    res.status(200).json({
      status: "SUCCESS",
      message: "Session is valid",
      payload: safePayload,
    });
    return;
  } catch (error: any) {
    res.status(500).json({
      status: "ERROR",
      message: error.message || "Server error during session check",
      payload: null,
    });
    return;
  }
};
