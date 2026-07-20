import { apiClient } from "@repo/helpers";
import { SERVER_API, ISinglePayload } from "@repo/core";

export interface InitiateResetResponse {
  resetType: "EMAIL" | "PHONE";
  destination: string;
}

export interface SetPasswordResponse {
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
      SERVER_API.initiatePasswordReset,
      {
        method: "POST",
        body: JSON.stringify({ identifier }),
      },
    );
  };

  /**
   * Submits the newly provisioned password inside the active token session window.
   */
  const setPassword = async (
    password: string,
  ): Promise<ISinglePayload<SetPasswordResponse>> => {
    return await apiClient<ISinglePayload<SetPasswordResponse>>(
      SERVER_API.setPassword,
      {
        method: "PATCH",
        body: JSON.stringify({
          purpose: "CREATE_PASSWORD",
          newPassword: password,
        }),
      },
    );
  };

  return { initiateReset, setPassword };
};
