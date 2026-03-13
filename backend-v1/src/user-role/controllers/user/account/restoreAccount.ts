import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import { UserModel } from "@/models/user/user";

export const restoreAccount = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  const authUserId = req.user?.id;

  try {
    const user = await UserModel.findOne({
      _id: authUserId,
      isDeleted: true,
    }).setOptions({ skipFilter: true });

    if (!user) {
      return res.status(404).json({
        status: "ERROR",
        message: "No deactivated account found or grace period has expired.",
        payload: null,
      });
    }

    // --- EMAIL CONFLICT RESOLUTION ---
    const originalEmail = user.email.split("_deleted_")[0];
    const emailInUse = await UserModel.findOne({
      email: originalEmail,
      isDeleted: false,
    });

    if (emailInUse) {
      return res.status(409).json({
        status: "ERROR",
        message: "Your original email is already in use by another account.",
        payload: { conflictEmail: originalEmail },
      });
    }

    // --- PERFORM RESTORATION ---
    user.isDeactivated = false;
    user.deactivatedAt = null as any;
    user.email = originalEmail;
    // Username is already correct as it was never obfuscated

    await user.save();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Welcome back! Your account has been fully restored.",
      payload: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Failed to restore account.",
      payload: null,
    });
  }
};
