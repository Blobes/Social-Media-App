import { UserModel } from "@repo/database";
import {
  IAuthRequest,
  userSensitiveFields,
  invalidatePattern,
} from "@repo/shared";
import { Response } from "express";

export const changeUsername = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const { newUsername } = req.body as { newUsername?: string };
  const userId = req.user?.id;

  // Define 90-day cooldown period in milliseconds
  const COOLDOWN_PERIOD = 90 * 24 * 60 * 60 * 1000;

  // Validate authentication state
  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      message: "Unauthorized access.",
      payload: null,
    });
  }

  // Ensure username meets minimum length requirements
  if (!newUsername || newUsername.trim().length < 3) {
    return res.status(400).json({
      status: "ERROR",
      message: "Username is required and must be at least 3 characters long.",
      payload: null,
    });
  }

  try {
    const formattedUsername = newUsername.trim();

    // Retrieve current user document to verify existence and cooldown status
    const currentUser = await UserModel.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        status: "ERROR",
        message: "User account not found.",
        payload: null,
      });
    }

    // Enforce the 90-day username change cooldown
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

    // Check for username conflicts across all accounts (including deactivated ones)
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

    // Update the username and timestamp in the database
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

    // This clears the profile, any list data, and metadata associated with that ID
    await invalidatePattern(`user:*:${userId}*`);

    // Convert document to plain object for sanitization
    const safePayload = updatedUser.toObject();

    // Remove sensitive internal fields before returning the payload
    userSensitiveFields().forEach((field) => {
      delete (safePayload as any)[field];
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Username updated successfully.",
      payload: safePayload,
    });
  } catch (error: any) {
    // Handle database-level unique constraint violations
    console.error("Change Username Error:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        status: "ERROR",
        message: "Username already in use.",
        payload: null,
      });
    }
    // General server error handling
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Internal server error.",
      payload: null,
    });
  }
};
