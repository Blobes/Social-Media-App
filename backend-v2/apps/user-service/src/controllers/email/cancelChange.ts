import { UserModel } from "@repo/database";
import { AuthRequest } from "@repo/shared";
import { Response, RequestHandler } from "express";

export const cancelEmailChange: RequestHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      status: "ERROR",
      message: "Unauthorized access",
      payload: null,
    });
    return;
  }

  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(404).json({
        status: "ERROR",
        message: "User not found",
        payload: null,
      });
      return;
    }

    // If there is no pending email, there's nothing to cancel
    if (!user.pendingEmail) {
      res.status(400).json({
        status: "ERROR",
        message: "No pending email change to cancel",
        payload: null,
      });
      return;
    }

    // --- THE REVERSION ---
    // We clear the pending email and all verification-related fields.
    user.pendingEmail = null;
    user.verificationCode = null;
    user.verificationExpiry = null;
    user.lastEmailCodeSentAt = null;

    // Ensure the original email is still marked as verified
    user.isEmailVerified = true;

    await user.save();

    res.status(200).json({
      status: "SUCCESS",
      message:
        "Email change process cancelled. Your current email remains active.",
      payload: null,
    });
    return;
  } catch (error: any) {
    res.status(500).json({
      status: "ERROR",
      message: error.message || "Server error during cancellation",
      payload: null,
    });
    return;
  }
};
