import { Response } from "express";
import {
  CACHE_KEYS,
  ensurePrimaryDevice,
  getOrSetDeviceToken,
  IAuthRequest,
  invalidateCache,
  upstashClient,
} from "@repo/shared";
import { UserModel } from "@repo/database";

/**
 * Updates onboarding progress and ensures the current authenticated device
 * is anchored as the Primary Device if none exists.
 */

export type OnboardingStep =
  | "INTRO"
  | "WELCOME_BACK"
  | "IDENTITY"
  | "DEMOGRAPHICS"
  | "VISUALS"
  | "PROFESSIONAL";

export const updateOnboarding = async (req: IAuthRequest, res: Response) => {
  const userId = req.user?.id;
  const sessionId = req.user?.sessionId;
  const jwtDeviceId = req.user?.deviceId; // Extracted from verified JWT via middleware

  if (!userId || !sessionId || !jwtDeviceId) {
    return res.status(401).json({
      status: "ERROR",
      message: "Unauthorized: Missing session or device context",
    });
  }

  const { onboardingStep, isOnboarded } = req.body as {
    onboardingStep: OnboardingStep;
    isOnboarded: boolean;
  };

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "ERROR", message: "User account not found" });
    }

    // --- PRIMARY ANCHOR LOGIC ---
    // If the user doesn't have a primary device, we use the one they are currently authenticated with.
    if (!user.primaryDeviceId) {
      // ensurePrimaryDevice handles the DB updates and session rotations
      await ensurePrimaryDevice(user, jwtDeviceId);

      // Update the fast-lookup cache for middleware
      await upstashClient.set(
        CACHE_KEYS.USER_PRIMARY_DEVICE(userId),
        jwtDeviceId,
      );
    }

    // --- PROGRESS UPDATE ---
    user.onboardingStep = onboardingStep;
    user.isOnboarded = isOnboarded || false;
    await user.save();

    // --- SESSION HEARTBEAT ---
    const sessionKey = CACHE_KEYS.USER_SESSION(userId, sessionId);
    const sessionData: any = await upstashClient.get(sessionKey);

    await upstashClient.set(
      sessionKey,
      {
        ...sessionData,
        lastActive: new Date(),
      },
      { ex: 20 * 24 * 60 * 60 },
    );

    // Surgical cache invalidation
    await invalidateCache(CACHE_KEYS.USER_PROFILE(userId));

    return res.status(200).json({
      status: "SUCCESS",
      message: "Onboarding progress synchronized",
      payload: user,
    });
  } catch (error: any) {
    console.error("Onboarding Sync Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Server error while updating onboarding state",
    });
  }
};
