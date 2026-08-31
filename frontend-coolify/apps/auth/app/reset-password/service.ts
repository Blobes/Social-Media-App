"use client";

import { apiClient } from "@repo/helpers";
import {
  SERVER_API,
  ISinglePayload,
  IdentifierType,
  OtpMessageChannel,
} from "@repo/core";

export interface InitiateResetResponse {
  resetType: IdentifierType;
  identifier: string;
}

export interface InitiateResetRequest {
  identifier: string;
  otpChannelType?: OtpMessageChannel;
}

export interface SetPasswordRequest {
  newPassword: string;
  purpose?: "CREATE_PASSWORD" | "CHANGE_PASSWORD" | "PASSWORD_RESET";
  identifier?: string;
  currentPassword?: string;
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
    request: InitiateResetRequest,
  ): Promise<ISinglePayload<InitiateResetResponse>> => {
    return await apiClient<ISinglePayload<InitiateResetResponse>>(
      SERVER_API.initiatePasswordReset,
      {
        method: "POST",
        body: JSON.stringify({
          identifier: request.identifier,
          otpChannelType: request.otpChannelType,
        }),
      },
    );
  };

  /**
   * Submits the newly provisioned password inside the active token session window.
   */
  const setPassword = async (
    request: SetPasswordRequest,
  ): Promise<ISinglePayload<SetPasswordResponse>> => {
    const {
      newPassword,
      purpose = "CREATE_PASSWORD",
      identifier,
      currentPassword,
    } = request;
    return await apiClient<ISinglePayload<SetPasswordResponse>>(
      SERVER_API.setPassword,
      {
        method: "PATCH",
        body: JSON.stringify({
          purpose,
          newPassword,
          identifier,
          currentPassword,
        }),
      },
    );
  };

  return { initiateReset, setPassword };
};
