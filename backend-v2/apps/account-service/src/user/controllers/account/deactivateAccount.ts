import { UserModel } from "@repo/database";
import { IAuthRequest, invalidatePattern } from "@repo/shared";
import { Response } from "express";

export const deactivateAccount = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const { targetId } = req.body as { targetId?: string };
  const authUserId = req.user?.id;
  const userRole = req.user?.role;

  // Validate authentication state
  if (!authUserId) {
    return res.status(401).json({
      status: "ERROR",
      message: "Unauthorized",
      payload: null,
    });
  }

  try {
    // Determine if the user is deactivating themselves or if an admin is intervening
    const isDeactivatingSelf = !targetId || targetId === authUserId;
    const finalIdToProcess = isDeactivatingSelf ? authUserId : targetId;

    // Permissions check: Only admins can deactivate other users
    if (!isDeactivatingSelf && userRole !== "ADMIN") {
      return res.status(403).json({
        status: "ERROR",
        message: "You don't have permission to perform this action",
        payload: null,
      });
    }

    // Verify user existence before attempting update
    const userToExclude = await UserModel.findById(finalIdToProcess);

    if (!userToExclude) {
      return res.status(404).json({
        status: "ERROR",
        message: "User not found",
        payload: null,
      });
    }

    // Prevent redundant deactivation calls
    if (userToExclude.isDeactivated) {
      return res.status(400).json({
        status: "ERROR",
        message: "Account is already deactivated",
        payload: null,
      });
    }

    const timestamp = Date.now();

    // Perform soft-delete by updating status and obfuscating the email
    await UserModel.findByIdAndUpdate(
      finalIdToProcess,
      {
        $set: {
          isDeactivated: true,
          deactivatedAt: new Date(),
          accountStatus: "DEACTIVATED",
          // email: `${userToExclude.email}_deactivated_${timestamp}`,
          verificationCode: null,
          pendingEmail: null,
        },
      },
      { new: true },
    );

    // This clears the profile, any list data, and metadata associated with that ID
    await invalidatePattern(`user:*:${finalIdToProcess}*`);

    // Remove authentication cookies if the user deactivated their own account
    if (isDeactivatingSelf) {
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
      message: isDeactivatingSelf
        ? "Your account has been deactivated. You have 30 days to restore it before permanent removal."
        : "User account deactivated by administrator.",
      payload: null,
    });
  } catch (error: any) {
    // Log error for internal monitoring and return generic failure message
    console.error("Soft Delete Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Failed to deactivate account.",
      payload: null,
    });
  }
};
