"use client";

import { apiClient } from "@repo/helpers";
import { ISinglePayload, OtpChannel, Purpose, SERVER_API } from "@repo/core";

export interface OtpRequest {
  code?: string;
  recipient: string;
  purpose?: Purpose;
  channel?: OtpChannel;
}

export const OtpService = () => {
  const dispatchOtp = async (
    request: OtpRequest,
  ): Promise<ISinglePayload<OtpRequest>> => {
    const { recipient, purpose = "LOGIN" } = request;
    return await apiClient<ISinglePayload<OtpRequest>>(SERVER_API.sendOtp, {
      method: "POST",
      body: JSON.stringify({ recipient, purpose }),
    });
  };

  const verifyOtp = async (
    request: OtpRequest,
  ): Promise<ISinglePayload<any>> => {
    const { code, recipient, purpose = "LOGIN" } = request;
    return await apiClient(SERVER_API.verifyOtp, {
      method: "PUT",
      body: JSON.stringify({ code, recipient, purpose }),
    });
  };

  const verifyEmailOtp = async (code: string): Promise<ISinglePayload<any>> => {
    return await apiClient(SERVER_API.verifyEmail, {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  };

  const verifyPhoneOtp = async (code: string): Promise<ISinglePayload<any>> => {
    return await apiClient(SERVER_API.verifyPhone, {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  };

  return {
    dispatchOtp,
    verifyOtp,
    verifyEmailOtp,
    verifyPhoneOtp,
  };
};
