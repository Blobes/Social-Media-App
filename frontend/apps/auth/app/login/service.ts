import { fetcher, serverApi } from "@repo/helpers";
import { IUser, ISingleResponse, FetchStatus } from "@repo/types";

interface LoginCredentials {
  email: string;
  password: string;
}
interface LoginResponse extends ISingleResponse<IUser> {
  fixedMsg?: string;
}
interface checkResponse extends ISingleResponse<IUser> {
  isCredentialAvailable: boolean;
}

export const LoginService = () => {
  const checkEmail = async (email: string): Promise<checkResponse> => {
    return await fetcher<checkResponse>(serverApi.checkEmail, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  type PurposeType = "REGISTRATION" | "LOGIN";

  const checkUsername = async (
    username: string,
    purpose: PurposeType = "LOGIN",
  ): Promise<checkResponse> => {
    return await fetcher<checkResponse>(serverApi.checkUsername, {
      method: "POST",
      body: JSON.stringify({ username, usedFor: purpose }),
    });
  };

  const login = async (
    credentials: LoginCredentials,
  ): Promise<LoginResponse> => {
    return await fetcher<LoginResponse>(serverApi.login, {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  };

  return { checkEmail, checkUsername, login };
};
