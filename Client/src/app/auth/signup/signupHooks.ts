"use client";

import { useAppContext } from "@/app/AppContext";
import { useSharedHooks } from "@/hooks";
import { fetcher } from "@/helpers/fetcher";
import { IUser, SingleResponse } from "@/types";
import { useRouter } from "next/navigation";
import { ModalRef } from "@/components/Modal";
import { deleteCookie, getCookie, setCookie } from "@/helpers/others";
import { useRef } from "react";

interface LoginCredentials {
  email: string;
  password: string;
}
interface LoginResponse extends SingleResponse<IUser> {
  fixedMsg?: string;
}
interface SignupInfo {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

export const useAuth = (drawerRef?: React.RefObject<ModalRef>) => {
  const {
    setAuthUser,
    setLoginStatus,
    setPage,
    setSnackBarMsgs,
    setInlineMsg,
  } = useAppContext();
  const { setSBMessage: setFbMessage } = useSharedHooks();
  const router = useRouter();

  const handleLogin = async (
    credentials: LoginCredentials
  ): Promise<LoginResponse | null> => {
    try {
      // Step 2: Attempt login request
      const res = await fetcher<LoginResponse>("/auth/login", {
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
        msg.toLowerCase().includes(sub)
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
    info: SignupInfo
  ): Promise<SingleResponse<IUser> | null> => {
    return null;
  };

  return {
    handleLogin,
    handleSignup,
  };
};
