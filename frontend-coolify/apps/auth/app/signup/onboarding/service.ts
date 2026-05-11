import { ISinglePayload, IUser, OnboardingStep, SERVER_API } from "@repo/core";
import { apiClient } from "@repo/helpers";

/**
 * Services for user onboarding data persistence.
 */
export const OnboardingService = () => {
  const syncIdentity = async (payload: {
    firstName: string;
    lastName: string;
    username: string;
  }): Promise<ISinglePayload<IUser>> => {
    return await apiClient<ISinglePayload<IUser>>(SERVER_API.updateBasicInfo, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  };

  const updateProgress = async (
    step: OnboardingStep,
    isDone: boolean = false,
  ) => {
    return await apiClient(SERVER_API.updateOnboarding, {
      method: "POST",
      body: JSON.stringify({ onboardingStep: step, isOnboarded: isDone }),
    });
  };

  return { syncIdentity, updateProgress };
};
