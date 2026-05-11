import bcrypt from "bcrypt";
import { UserModel } from "@repo/database";
import {
  IAuthRequest,
  userSensitiveFields,
  invalidatePattern,
  CACHE_KEYS,
} from "@repo/shared";
import { Response } from "express";

/**
 * Updates username with a 5-minute password grace period tracked on the model.
 */
export const changeUsername = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const { newUsername, password } = req.body as {
    newUsername?: string;
    password?: string;
  };

  const userId = req.user?.id;
  const COOLDOWN_PERIOD = 90 * 24 * 60 * 60 * 1000;
  const GRACE_PERIOD_MS = 15 * 60 * 1000; // 15 minutes

  if (!userId) {
    return res
      .status(401)
      .json({
        status: "ERROR",
        message: "Unauthorized access.",
        payload: null,
      });
  }

  try {
    const formattedUsername = newUsername?.trim();
    if (!formattedUsername || formattedUsername.length < 3) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "Invalid username.", payload: null });
    }

    const user = await UserModel.findById(userId).select("+password");
    if (!user)
      return res
        .status(404)
        .json({ status: "ERROR", message: "User not found.", payload: null });

    // --- GRACE PERIOD CHECK ---
    const lastVerified = user.lastPasswordVerifiedAt
      ? new Date(user.lastPasswordVerifiedAt).getTime()
      : 0;
    const isGracePeriodActive = Date.now() - lastVerified < GRACE_PERIOD_MS;

    if (!isGracePeriodActive) {
      if (!password) {
        return res.status(400).json({
          status: "ERROR",
          message: "Please provide your password to confirm identity.",
          payload: null,
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          status: "ERROR",
          message: "Incorrect password.",
          payload: null,
        });
      }

      // Update the password verification timestamp
      user.lastPasswordVerifiedAt = new Date();
    }

    // --- COOLDOWN CHECK ---
    if (user.lastUsernameChangeAt) {
      const nextAllowedDate =
        new Date(user.lastUsernameChangeAt).getTime() + COOLDOWN_PERIOD;
      if (Date.now() < nextAllowedDate) {
        const daysLeft = Math.ceil(
          (nextAllowedDate - Date.now()) / (24 * 60 * 60 * 1000),
        );
        return res.status(403).json({
          status: "ERROR",
          message: `Cooldown active. Wait ${daysLeft} days.`,
        });
      }
    }

    // --- AVAILABILITY CHECK ---
    const conflict = await UserModel.findOne({
      username: { $regex: new RegExp(`^${formattedUsername}$`, "i") },
      _id: { $ne: userId },
    }).setOptions({ skipFilter: true });

    if (conflict) {
      return res
        .status(409)
        .json({ status: "ERROR", message: "Username already taken." });
    }

    user.username = formattedUsername;
    user.lastUsernameChangeAt = new Date();
    await user.save();

    await invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(userId));

    const safePayload = user.toObject();
    userSensitiveFields().forEach(
      (field) => delete (safePayload as any)[field],
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "Username updated successfully.",
      payload: safePayload,
    });
  } catch (error: any) {
    console.error("Change Username Error:", error);
    return res
      .status(500)
      .json({ status: "ERROR", message: "Internal server error." });
  }
};
