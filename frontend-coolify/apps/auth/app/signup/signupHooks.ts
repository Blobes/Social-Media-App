"use client";

import { useGlobalContext } from "@repo/shared-state";
import { apiClient, deleteCookie } from "@repo/helpers";
import { IUser, ISinglePayload, DrawerRef } from "@repo/types";
import { useRouter } from "next/navigation";

interface LoginCredentials {
  email: string;
  password: string;
}
interface LoginResponse extends ISinglePayload<IUser> {
  fixedMsg?: string;
}
interface SignupInfo {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

export const useSignup = (drawerRef?: React.RefObject<DrawerRef>) => {
  const {
    setAuthUser,
    setAuthStatus: setLoginStatus,
    setPage,
    setSnackBarMsg: setSnackBarMsgs,
    setInlineMsg,
  } = useGlobalContext();
  const router = useRouter();

  const handleLogin = async (
    credentials: LoginCredentials,
  ): Promise<LoginResponse | null> => {
    try {
      // Step 2: Attempt login request
      const res = await apiClient<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      // Step 3: On success — reset auth state
      const { message: message, payload, status } = res;
      setAuthUser(payload!);
      setLoginStatus("AUTHENTICATED");
      deleteCookie("loginAttempts"); // reset attempt count

      return {
        payload: payload!,
        message: message,
        status: status,
      };
    } catch (error: any) {
      // Step 4: Handle login failure
      const msg = error.message || "";
      const isPasswordErr = msg.toLowerCase().includes("password");
      const isEmailOrNetworkErr = ["server", "network", "email"].some((sub) =>
        msg.toLowerCase().includes(sub),
      );
      // Increment attempt count if password is wrong

      return {
        payload: null,
        message: error.message,
        status: error.status,
      };
    }
  };

  const handleSignup = async (
    info: SignupInfo,
  ): Promise<ISinglePayload<IUser> | null> => {
    return null;
  };

  return {
    handleLogin,
    handleSignup,
  };
};
