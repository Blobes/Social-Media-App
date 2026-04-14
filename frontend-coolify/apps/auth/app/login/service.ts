"use client";

import { apiClient } from "@repo/helpers";
import { IUser, ISinglePayload, SERVER_API } from "@repo/core";

interface LoginCredentials {
  identifier: string;
  password: string;
}
interface LoginResponse extends ISinglePayload<IUser> {
  fixedMsg?: string;
}
interface checkResponse extends ISinglePayload<IUser> {
  isExisting: boolean;
}

export const LoginService = () => {
  const checkEmail = async (email: string): Promise<checkResponse> => {
    return await apiClient<checkResponse>(SERVER_API.checkEmail, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  const checkPhone = async (phone: string): Promise<checkResponse> => {
    return await apiClient<checkResponse>(SERVER_API.checkPhone, {
      method: "POST",
      body: JSON.stringify({ phone: phone }),
    });
  };

  type PurposeType = "REGISTRATION" | "LOGIN";
  const checkUsername = async (
    username: string,
    purpose: PurposeType = "LOGIN",
  ): Promise<checkResponse> => {
    return await apiClient<checkResponse>(SERVER_API.checkUsername, {
      method: "POST",
      body: JSON.stringify({ username, usedFor: purpose }),
    });
  };

  const login = async (
    credentials: LoginCredentials,
  ): Promise<LoginResponse> => {
    return await apiClient<LoginResponse>(SERVER_API.login, {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  };

  return { checkEmail, checkPhone, checkUsername, login };
};
