"use client";

import { apiClient } from "@repo/helpers";
import {
  ISinglePayload,
  OtpChannel,
  TransitPurpose,
  SERVER_API,
} from "@repo/core";

export interface OtpRequest {
  code?: string;
  recipient?: string;
  purpose?: TransitPurpose;
  channel?: OtpChannel;
}

export type TFAPurpose = "AUTHENTICATE" | "TFA_SETUP";

export interface TFAInitiationRequest {
  purpose: TFAPurpose;
  identifier?: string;
}

export interface TFAInitiationResponse {
  qrCodeDataUrl: string | null;
  manualEntryKey: string | null;
  isMfaActive: boolean;
}

export interface TFAVerificationRequest {
  purpose: TFAPurpose;
  token: string;
  identifier?: string;
}

export interface TFAVerificationResponse {
  isRecovery?: boolean;
  backupCodes?: string[];
}

export const OtpService = () => {
  const dispatchOtp = async (
    request: OtpRequest,
  ): Promise<ISinglePayload<OtpRequest>> => {
    const { recipient, purpose = "ACCOUNT_VERIFICATION" } = request;
    return await apiClient<ISinglePayload<OtpRequest>>(SERVER_API.sendOtp, {
      method: "POST",
      body: JSON.stringify({ recipient, purpose }),
    });
  };

  const verifyOtp = async (
    request: OtpRequest,
  ): Promise<ISinglePayload<any>> => {
    const { code, recipient, purpose = "ACCOUNT_VERIFICATION" } = request;
    return await apiClient(SERVER_API.verifyOtp, {
      method: "POST",
      body: JSON.stringify({ code, recipient, purpose }),
    });
  };

  const finalizeEmailUpdateOtp = async (
    code: string,
  ): Promise<ISinglePayload<any>> => {
    return await apiClient(SERVER_API.finalizeEmailChange, {
      method: "PATCH",
      body: JSON.stringify({ code }),
    });
  };

  const finalizePhoneUpdateOtp = async (
    code: string,
  ): Promise<ISinglePayload<any>> => {
    return await apiClient(SERVER_API.finalizePhoneChange, {
      method: "PATCH",
      body: JSON.stringify({ code }),
    });
  };

  /**
   * Initializes a multi-factor authentication setup configuration session or login challenge context.
   */
  const initiateTFA = async (
    request: TFAInitiationRequest,
  ): Promise<ISinglePayload<TFAInitiationResponse>> => {
    const { purpose, identifier } = request;
    return await apiClient<ISinglePayload<TFAInitiationResponse>>(
      SERVER_API.initiateTFA,
      {
        method: "POST",
        body: JSON.stringify({ purpose, identifier }),
      },
    );
  };

  /**
   * Validates safety codes during authentication checkpoints or finalized registration workflows.
   */
  const verifyTFA = async (
    request: TFAVerificationRequest,
  ): Promise<ISinglePayload<TFAVerificationResponse>> => {
    const { purpose, token, identifier } = request;
    return await apiClient<ISinglePayload<TFAVerificationResponse>>(
      SERVER_API.verifyTFA,
      {
        method: "POST",
        body: JSON.stringify({ purpose, token, identifier }),
      },
    );
  };

  return {
    dispatchOtp,
    verifyOtp,
    finalizeEmailUpdateOtp,
    finalizePhoneUpdateOtp,
    initiateTFA,
    verifyTFA,
  };
};
