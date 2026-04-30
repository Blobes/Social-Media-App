"use client";

import { apiClient } from "@repo/helpers";
import { InputType, ISinglePayload, Purpose, SERVER_API } from "@repo/core";

interface SendOtp {
  destination: string;
  purpose: Purpose;
  channel?: InputType;
}

export const OtpService = () => {
  const sendOtp = async (
    destination: string,
    purpose: Purpose = "LOGIN",
  ): Promise<SendOtp> => {
    return await apiClient<SendOtp>(SERVER_API.sendOtp, {
      method: "POST",
      body: JSON.stringify({ destination, purpose }),
    });
  };

  const verifyOtp = async (
    source: string,
    code: string,
  ): Promise<ISinglePayload<any>> => {
    return await apiClient(SERVER_API.verifyOtp, {
      method: "POST",
      body: JSON.stringify({ source, code }),
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
