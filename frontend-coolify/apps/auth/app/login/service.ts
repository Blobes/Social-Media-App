import { apiClient, serverApi } from "@repo/helpers";
import { IUser, ISinglePayload } from "@repo/types";

interface LoginCredentials {
  email: string;
  password: string;
}
interface LoginResponse extends ISinglePayload<IUser> {
  fixedMsg?: string;
}
interface checkResponse extends ISinglePayload<IUser> {
  isCredentialAvailable: boolean;
}

export const LoginService = () => {
  const checkEmail = async (email: string): Promise<checkResponse> => {
    return await apiClient<checkResponse>(serverApi.checkEmail, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  type PurposeType = "REGISTRATION" | "LOGIN";

  const checkUsername = async (
    username: string,
    purpose: PurposeType = "LOGIN",
  ): Promise<checkResponse> => {
    return await apiClient<checkResponse>(serverApi.checkUsername, {
      method: "POST",
      body: JSON.stringify({ username, usedFor: purpose }),
    });
  };

  const login = async (
    credentials: LoginCredentials,
  ): Promise<LoginResponse> => {
    return await apiClient<LoginResponse>(serverApi.login, {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  };

  return { checkEmail, checkUsername, login };
};
