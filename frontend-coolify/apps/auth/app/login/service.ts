"use client";

import { apiClient } from "@repo/helpers";
import {
  IUser,
  ISinglePayload,
  SERVER_API,
  OtpReason,
  Action,
} from "@repo/core";

interface LoginRequest {
  identifier: string;
  password: string;
}
export interface LoginResponse extends ISinglePayload<IUser> {
  requireOtp?: boolean;
  otpReason: OtpReason;
  fixedMsg?: string;
}

export interface CheckResponse extends ISinglePayload<IUser> {
  isExisting: boolean;
  suggestions?: string[];
}

export const LoginService = () => {
  const checkEmail = async (email: string): Promise<CheckResponse> => {
    return await apiClient<CheckResponse>(SERVER_API.checkEmail, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  const checkPhone = async (phone: string): Promise<CheckResponse> => {
    return await apiClient<CheckResponse>(SERVER_API.checkPhone, {
      method: "POST",
      body: JSON.stringify({ phone: phone }),
    });
  };

  const checkUsername = async (
    username: string,
    purpose: Action = "LOGIN",
  ): Promise<CheckResponse> => {
    return await apiClient<CheckResponse>(SERVER_API.checkUsername, {
      method: "POST",
      body: JSON.stringify({ username, purpose }),
    });
  };

  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    return await apiClient<LoginResponse>(SERVER_API.login, {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  };

  return { checkEmail, checkPhone, checkUsername, login };
};
