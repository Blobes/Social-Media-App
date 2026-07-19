import { apiClient } from "@repo/helpers";
import { SERVER_API, ISinglePayload } from "@repo/core";

export interface InitiateResetResponse {
  resetType: "EMAIL" | "PHONE";
  destination: string;
}

export interface ConfirmResetResponse {
  loggedOut: boolean;
}

/**
 * Service handling password reset operations using the unified core payload contracts.
 */
export const ResetPasswordService = () => {
  /**
   * Initiates standard password reset process via identifier verification.
   */
  const initiateReset = async (
    identifier: string,
  ): Promise<ISinglePayload<InitiateResetResponse>> => {
    return await apiClient<ISinglePayload<InitiateResetResponse>>(
      SERVER_API.resetPassword,
      {
        method: "POST",
        body: JSON.stringify({ identifier }),
      },
    );
  };

  /**
   * Submits the newly provisioned password inside the active token session window.
   */
  const confirmReset = async (
    password: string,
  ): Promise<ISinglePayload<ConfirmResetResponse>> => {
    return await apiClient<ISinglePayload<ConfirmResetResponse>>(
      SERVER_API.setPassword,
      {
        method: "POST",
        body: JSON.stringify({
          purpose: "CREATE_PASSWORD",
          newPassword: password,
        }),
      },
    );
  };

  return { initiateReset, confirmReset };
};
