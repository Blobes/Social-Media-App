import { Response } from "express";
import {
  CACHE_KEYS,
  IAuthRequest,
  invalidateCache,
  upstashClient,
} from "@repo/shared";
import { UserModel } from "@repo/database";

/**
 * Updates onboarding progress.
 */
export const updateOnboarding = async (req: IAuthRequest, res: Response) => {
  const userId = req.user?.id;
  const sessionId = req.user?.sessionId;
  const currentDeviceId = req.cookies["device_id"] || "unknown";

  if (!userId || !sessionId) {
    return res.status(401).json({ status: "ERROR", message: "Unauthorized" });
  }

  const { onboardingStep, isOnboarded } = req.body;

  try {
    const user = await UserModel.findById(userId).select("primarySessionId");
    const updateFields: any = {
      onboardingStep,
      isOnboarded: isOnboarded || false,
    };

    // If no primary session exists, claim this one
    if (!user?.primarySessionId) {
      updateFields.primarySessionId = sessionId;

      // Permanently set in cache (no expiry or long expiry) to match DB
      await upstashClient.set(
        CACHE_KEYS.USER_PRIMARY_DEVICE(userId),
        sessionId,
      );
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true },
    );

    // Refresh Session Heartbeat
    const sessionKey = CACHE_KEYS.USER_SESSION(userId, sessionId);
    await upstashClient.set(
      sessionKey,
      {
        deviceId: currentDeviceId,
        userAgent: req.get("user-agent") || "unknown",
        ip: req.ip || "unknown",
        lastActive: new Date(),
      },
      { ex: 20 * 24 * 60 * 60 },
    );

    await invalidateCache(CACHE_KEYS.USER_PROFILE(userId));

    return res.status(200).json({
      status: "SUCCESS",
      message: "Onboarding updated",
      payload: updatedUser,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "ERROR", message: "Internal server error" });
  }
};
