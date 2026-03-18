import { UserModel } from "@repo/database";
import { IAuthRequest } from "@repo/shared";
import { Response } from "express";

export const deactivateAccount = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const { targetId } = req.body as { targetId?: string };
  const authUserId = req.user?.id;
  const userRole = req.user?.role;

  if (!authUserId) {
    return res.status(401).json({
      status: "ERROR",
      message: "Unauthorized",
      payload: null,
    });
  }

  try {
    const isDeletingSelf = !targetId || targetId === authUserId;
    const finalIdToProcess = isDeletingSelf ? authUserId : targetId;

    if (!isDeletingSelf && userRole !== "ADMIN") {
      return res.status(403).json({
        status: "ERROR",
        message: "You don't have permission to perform this action",
        payload: null,
      });
    }

    const userToExclude = await UserModel.findById(finalIdToProcess);

    if (!userToExclude) {
      return res.status(404).json({
        status: "ERROR",
        message: "User not found",
        payload: null,
      });
    }

    if (userToExclude.isDeactivated) {
      return res.status(400).json({
        status: "ERROR",
        message: "Account is already deactivated",
        payload: null,
      });
    }

    const timestamp = Date.now();

    await UserModel.findByIdAndUpdate(
      finalIdToProcess,
      {
        $set: {
          isDeactivated: true,
          deactivatedAt: new Date(),
          accountStatus: "DEACTIVATED",
          // Only obfuscate email to allow new registrations
          email: `${userToExclude.email}_deleted_${timestamp}`,
          verificationCode: null,
          pendingEmail: null,
        },
      },
      { new: true },
    );

    // --- CLEAR AUTH COOKIES ON SELF-DEACTIVATION ---
    if (isDeletingSelf) {
      res.clearCookie("access_token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: isDeletingSelf
        ? "Your account has been deactivated. You have 30 days to restore it before permanent removal."
        : "User account deactivated by administrator.",
      payload: null,
    });
  } catch (error: any) {
    console.error("Soft Delete Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Failed to deactivate account.",
      payload: null,
    });
  }
};
