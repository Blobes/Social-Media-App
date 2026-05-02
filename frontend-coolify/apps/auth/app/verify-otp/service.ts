"use client";

import { apiClient } from "@repo/helpers";
import { InputType, ISinglePayload, Purpose, SERVER_API } from "@repo/core";

interface OtpRequest {
  code?: string;
  identifier: string;
  purpose?: Purpose;
  channel?: InputType;
}

export const OtpService = () => {
  const sendOtp = async (request: OtpRequest): Promise<OtpRequest> => {
    const { identifier, purpose = "LOGIN" } = request;
    return await apiClient<OtpRequest>(SERVER_API.sendOtp, {
      method: "POST",
      body: JSON.stringify({ identifier, purpose }),
    });
  };

  const verifyOtp = async (
    request: OtpRequest,
  ): Promise<ISinglePayload<any>> => {
    const { code, identifier, purpose = "LOGIN" } = request;
    return await apiClient(SERVER_API.verifyOtp, {
      method: "POST",
      body: JSON.stringify({ code, source: identifier, purpose }),
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

  return { sendOtp, verifyOtp, verifyEmailOtp, verifyPhoneOtp };
};
