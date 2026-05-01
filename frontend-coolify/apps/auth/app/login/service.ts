"use client";

import { apiClient, getOrCreateDeviceId } from "@repo/helpers";
import { IUser, ISinglePayload, SERVER_API, Purpose } from "@repo/core";

interface LoginCredentials {
  identifier: string;
  password: string;
  deviceId?: string;
}
interface LoginResponse extends ISinglePayload<IUser> {
  fixedMsg?: string;
}

interface SetPSessionReq {
  sessionId: string;
}
interface SetPSessionRes extends ISinglePayload<SetPSessionReq> {
  primarySessionId: string;
}

export interface checkResponse extends ISinglePayload<IUser> {
  isExisting: boolean;
  needsVerification: boolean;
  isOnboarded: boolean;
  isVerified?: boolean;
}

export const LoginService = () => {
  const deviceId = getOrCreateDeviceId();

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

  const checkUsername = async (
    username: string,
    purpose: Purpose = "LOGIN",
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
      body: JSON.stringify({ deviceId, ...credentials }),
    });
  };

  const setPrimarySession = async (
    targetSession: SetPSessionReq,
  ): Promise<SetPSessionRes> => {
    return await apiClient<SetPSessionRes>(SERVER_API.setPrimarySession, {
      method: "PATCH",
      body: JSON.stringify(targetSession),
    });
  };

  return { checkEmail, checkPhone, checkUsername, login, setPrimarySession };
};
