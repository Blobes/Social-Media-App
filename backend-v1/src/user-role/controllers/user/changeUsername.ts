import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import { UserModel } from "@/models/user/user";
import { userSensitiveFields } from "@/utils/sanitize";

export const changeUsername = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  const { newUsername } = req.body as { newUsername?: string };
  const userId = req.user?.id;

  // 90-day cooldown in milliseconds
  const COOLDOWN_PERIOD = 90 * 24 * 60 * 60 * 1000;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      message: "Unauthorized access.",
      payload: null,
    });
  }

  if (!newUsername || newUsername.trim().length < 3) {
    return res.status(400).json({
      status: "ERROR",
      message: "Username is required and must be at least 3 characters long.",
      payload: null,
    });
  }

  try {
    const formattedUsername = newUsername.trim();

    // 1. Fetch current user to check cooldown
    const currentUser = await UserModel.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        status: "ERROR",
        message: "User account not found.",
        payload: null,
      });
    }

    // 2. Cooldown Verification
    if (currentUser.lastUsernameChangeAt) {
      const lastChange = new Date(currentUser.lastUsernameChangeAt).getTime();
      const nextAllowedDate = lastChange + COOLDOWN_PERIOD;
      const now = Date.now();

      if (now < nextAllowedDate) {
        const daysLeft = Math.ceil(
          (nextAllowedDate - now) / (24 * 60 * 60 * 1000),
        );
        return res.status(403).json({
          status: "ERROR",
          message: `You can only change your username once every 90 days. Please wait ${daysLeft} more days.`,
          payload: null,
        });
      }
    }

    // 3. Availability Check (Including Deactivated/Soft-Deleted Accounts)
    // We skip the filter to ensure we don't allow "stealing" usernames from deactivated users.
    const conflict = await UserModel.findOne({
      username: { $regex: new RegExp(`^${formattedUsername}$`, "i") },
      _id: { $ne: userId },
    }).setOptions({ skipFilter: true });

    if (conflict) {
      return res.status(409).json({
        status: "ERROR",
        message:
          "This username is already taken or reserved by a deactivated account.",
        payload: null,
      });
    }

    // 4. Perform the Update
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          username: formattedUsername,
          lastUsernameChangeAt: new Date(),
        },
      },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: "ERROR",
        message: "Failed to update username. Account might be inactive.",
        payload: null,
      });
    }

    const safePayload = updatedUser.toObject();

    // Sanitize sensitive fields
    userSensitiveFields().forEach((field) => {
      delete (safePayload as any)[field];
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Username updated successfully.",
      payload: safePayload,
    });
  } catch (error: any) {
    console.error("Change Username Error:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        status: "ERROR",
        message: "Username already in use.",
        payload: null,
      });
    }
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Internal server error.",
      payload: null,
    });
  }
};
