import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import {
  OnboardingStep,
  syncOnboarding,
} from "@/auth/registration/services/onboarding";

/**
 * Controller endpoint to modify profile onboarding metrics and tracking states.
 */
export const updateOnboarding = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const sessionId = req.user?.sessionId;
  const jwtDeviceId = req.user?.deviceId;

  if (!userId || !sessionId || !jwtDeviceId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  const { onboardingStep, isOnboarded } = req.body as {
    onboardingStep: OnboardingStep;
    isOnboarded: boolean;
  };

  if (!onboardingStep) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.ONBOARDING.MISSING_STEP,
      payload: null,
    });
  }

  try {
    const serviceResult = await syncOnboarding({
      userId,
      sessionId,
      jwtDeviceId,
      onboardingStep,
      isOnboarded,
    });

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Onboarding Sync Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
