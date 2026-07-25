import { UserModel } from "@repo/database";
import {
  CACHE_KEYS,
  ensurePrimaryDevice,
  invalidateCache,
  MESSAGES_REGISTRY,
  TransInfo,
  setCache,
  getCache,
} from "@repo/shared";

export type OnboardingStep =
  | "INTRO"
  | "WELCOME_BACK"
  | "IDENTITY"
  | "DEMOGRAPHICS"
  | "VISUALS"
  | "PROFESSIONAL";

interface IOnboardingInput {
  userId: string;
  sessionId: string;
  jwtDeviceId: string;
  onboardingStep: OnboardingStep;
  isOnboarded: boolean;
}

interface IOnboardingResult {
  status: "SUCCESS" | "NOT_FOUND";
  transInfo?: TransInfo;
  payload?: any;
}

/**
 * Synchronizes user onboarding tracks, anchors primary devices, and pushes cache updates.
 */
export const syncOnboarding = async (
  input: IOnboardingInput,
): Promise<IOnboardingResult> => {
  const { userId, sessionId, jwtDeviceId, onboardingStep, isOnboarded } = input;

  const user = await UserModel.findById(userId);
  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  // Anchor verified device context as core identifier if field is empty
  if (!user.primaryDeviceId) {
    await ensurePrimaryDevice(user, jwtDeviceId);

    await setCache(CACHE_KEYS.USER_PRIMARY_DEVICE(userId), jwtDeviceId);
  }

  // Persist pipeline metrics
  user.onboardingStep = onboardingStep;
  user.isOnboarded = isOnboarded || false;
  await user.save();

  // Refresh structural session state expiration parameters
  const sessionKey = CACHE_KEYS.USER_SESSION(userId, sessionId);
  const sessionData: any = await getCache(sessionKey);

  await setCache(
    sessionKey,
    {
      ...sessionData,
      lastActive: new Date(),
    },
    20 * 24 * 60 * 60,
  );

  // Invalidate stale user queries
  await invalidateCache(CACHE_KEYS.USER_PROFILE(userId));

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.ONBOARDING.PROGRESS_SYNCHRONIZED,
    payload: user,
  };
};
