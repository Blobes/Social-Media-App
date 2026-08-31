"use client";

import { apiClient } from "@repo/helpers";
import {
  ISinglePayload,
  OtpMessageChannel,
  TransitPurpose,
  SERVER_API,
  IdentifierType,
} from "@repo/core";

export interface OtpRequest {
  code?: string;
  recipient?: string;
  purpose?: TransitPurpose;
  messageChannel?: OtpMessageChannel;
}

export interface OtpResponse {
  identifier?: string;
  verificationToken?: string;
  purpose?: TransitPurpose;
  otpIdentifierType?: IdentifierType;
}

export type TotpActionType = "AUTHENTICATE" | "CONFIGURE";

export interface TotpSetupRequest {
  actionType: TotpActionType;
  identifier?: string;
}

export interface TotpSetupResponse {
  qrCodeDataUrl: string | null;
  manualEntryKey: string | null;
  isMfaActive: boolean;
}

export interface TotpVerificationRequest {
  actionType: TotpActionType;
  token: string;
  identifier?: string;
}

export interface TotpVerificationResponse {
  isRecovery?: boolean;
  backupCodes?: string[];
}

export interface IdentifierChangeResult {
  identifier?: string;
  loggedOut?: boolean;
}

export const OtpService = () => {
  const dispatchMsgCode = async (
    request: OtpRequest,
  ): Promise<ISinglePayload<OtpRequest>> => {
    const { recipient } = request;
    return await apiClient<ISinglePayload<OtpRequest>>(SERVER_API.sendMsgCode, {
      method: "POST",
      body: JSON.stringify({ recipient }),
    });
  };

  const verifyMsgCode = async (
    request: OtpRequest,
  ): Promise<ISinglePayload<OtpResponse>> => {
    const { code, recipient, purpose = "LOGIN_VERIFICATION" } = request;
    return await apiClient(SERVER_API.verifyMsgCode, {
      method: "POST",
      body: JSON.stringify({ code, recipient, purpose }),
    });
  };

  const commitAccountUpdate = async (
    request: OtpResponse,
  ): Promise<ISinglePayload<any>> => {
    const {
      identifier,
      verificationToken,
      purpose = "LOGIN_VERIFICATION",
      otpIdentifierType,
    } = request;
    return await apiClient(SERVER_API.otpAccountUpdate, {
      method: "PATCH",
      body: JSON.stringify({
        identifier,
        verificationToken,
        purpose,
        otpIdentifierType,
      }),
    });
  };

  const finalizeEmailUpdateOtp = async (
    code: string,
  ): Promise<ISinglePayload<IdentifierChangeResult>> => {
    return await apiClient(SERVER_API.finalizeEmailChange, {
      method: "PATCH",
      body: JSON.stringify({ code }),
    });
  };

  const finalizePhoneUpdateOtp = async (
    code: string,
  ): Promise<ISinglePayload<IdentifierChangeResult>> => {
    return await apiClient(SERVER_API.finalizePhoneChange, {
      method: "PATCH",
      body: JSON.stringify({ code }),
    });
  };

  /**
   * Initializes a multi-factor authentication setup configuration session or login challenge context.
   */
  const setupTotp = async (
    request: TotpSetupRequest,
  ): Promise<ISinglePayload<TotpSetupResponse>> => {
    const { actionType: purpose, identifier } = request;
    return await apiClient<ISinglePayload<TotpSetupResponse>>(
      SERVER_API.setupTotp,
      {
        method: "POST",
        body: JSON.stringify({ purpose, identifier }),
      },
    );
  };

  /**
   * Validates safety codes during authentication checkpoints or finalized registration workflows.
   */
  const verifyTotpCode = async (
    request: TotpVerificationRequest,
  ): Promise<ISinglePayload<TotpVerificationResponse>> => {
    const { actionType: purpose, token, identifier } = request;
    return await apiClient<ISinglePayload<TotpVerificationResponse>>(
      SERVER_API.verifyTotp,
      {
        method: "POST",
        body: JSON.stringify({ purpose, token, identifier }),
      },
    );
  };

  return {
    dispatchMsgCode,
    verifyMsgCode,
    commitAccountUpdate,
    finalizeEmailUpdateOtp,
    finalizePhoneUpdateOtp,
    setupTotp,
    verifyTotpCode,
  };
};
