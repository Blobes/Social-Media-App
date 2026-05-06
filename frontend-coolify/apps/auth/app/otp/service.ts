"use client";

import { apiClient } from "@repo/helpers";
import { InputType, ISinglePayload, Purpose, SERVER_API } from "@repo/core";

interface OtpRequest {
  code?: string;
  recipient: string;
  purpose?: Purpose;
  channel?: InputType;
}

export const OtpService = () => {
  const sendOtp = async (request: OtpRequest): Promise<OtpRequest> => {
    const { recipient, purpose = "LOGIN" } = request;
    return await apiClient<OtpRequest>(SERVER_API.sendOtp, {
      method: "POST",
      body: JSON.stringify({ recipient, purpose }),
    });
  };

  const verifyOtp = async (
    request: OtpRequest,
  ): Promise<ISinglePayload<any>> => {
    const { code, recipient, purpose = "LOGIN" } = request;
    return await apiClient(SERVER_API.verifyOtp, {
      method: "POST",
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

  return { sendOtp, verifyOtp, verifyEmailOtp, verifyPhoneOtp };
};
