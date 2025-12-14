"use client";

import { useAppContext } from "@/app/AppContext";
import { useSharedHooks } from "@/hooks";
import { fetcher } from "@/helpers/fetcher";
import { IUser, SingleResponse, UserSnapshot } from "@/types";
import { useRouter } from "next/navigation";
import { deleteCookie, getCookie, setCookie } from "@/helpers/others";
import {
  clearLoginLock,
  formatRemainingTime,
  getLockRemaining,
} from "@/helpers/auth";
import { useRef } from "react";

interface LoginCredentials {
  email: string;
  password: string;
}
interface LoginResponse extends SingleResponse<IUser> {
  fixedMsg?: string;
}
interface CheckEmailResponse {
  emailNotTaken: boolean;
  message: string;
}

export const useAuth = () => {
  const {
    authUser,
    setAuthUser,
    setLoginStatus,
    setPage,
    setSnackBarMsgs,
    setInlineMsg,
    currentPage,
  } = useAppContext();
  const { setSBMessage, setCurrentPage } = useSharedHooks();
  const router = useRouter();
  const MAX_ATTEMPTS = 3;
  const LOCKOUT_MIN = 2;
  const loginAttempts = parseInt(getCookie("loginAttempts") || "0", 10);
  const lockTimestamp = getCookie("loginLockTime");
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const checkEmail = async (
    email: string
  ): Promise<CheckEmailResponse | null> => {
    try {
      const res = await fetcher<CheckEmailResponse>("/auth/check-email", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      console.log(res);
      return res;
    } catch (error: any) {
      setInlineMsg(error.message || "Something went wrong.");
      return null;
    }
  };

  const startLockCountdown = (lockTimestamp: number | string) => {
    // Prevent countdown if user isn't really locked out
    if (loginAttempts < MAX_ATTEMPTS && !lockTimestamp) {
      clearLoginLock();
      return;
    }
    // Clear any existing interval
    if (countdownRef.current) clearInterval(countdownRef.current);
    // Parse timestamp to number
    const lockTime =
      typeof lockTimestamp === "string" ? Number(lockTimestamp) : lockTimestamp;

    // Start countdown
    let remainingSec = getLockRemaining(lockTime, LOCKOUT_MIN);
    countdownRef.current = setInterval(() => {
      if (remainingSec <= 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        clearLoginLock();
        setSBMessage({
          msg: { content: "Login Activated", msgStatus: "SUCCESS" },
        });
        setInlineMsg(null);
      } else {
        setInlineMsg(
          `You've exceeded the maximum login attempts. Try again in ${formatRemainingTime(
            remainingSec
          )}. Or reset your password.`
        );
      }
      remainingSec--;
    }, 1000);
  };

  const handleLogin = async (
    credentials: LoginCredentials
  ): Promise<LoginResponse | null> => {
    // Step 1: Check if user is currently locked out
    const isLocked = loginAttempts >= MAX_ATTEMPTS && lockTimestamp;
    const remainingSec = isLocked
      ? getLockRemaining(lockTimestamp, LOCKOUT_MIN)
      : 0;

    if (remainingSec <= 0) clearLoginLock(); // Unlock if time expired

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
      if (isPasswordErr) {
        setCookie("loginAttempts", String(loginAttempts + 1), LOCKOUT_MIN);
      }

      // Step 5: Determine fixed feedback message
      let fixedMessage = error.message;
      if (isEmailOrNetworkErr) {
        fixedMessage = msg;
      } else if (isPasswordErr && loginAttempts + 1 < MAX_ATTEMPTS) {
        fixedMessage = `Wrong password. You have ${
          MAX_ATTEMPTS - loginAttempts - 1
        } attempt(s) left.`;
      } else if (isPasswordErr && loginAttempts + 1 >= MAX_ATTEMPTS) {
        const lockTime = Date.now();
        setCookie("loginLockTime", String(lockTime), LOCKOUT_MIN);
        startLockCountdown(lockTime); // Start countdown
        return null;
      }

      return {
        payload: null,
        message: error.message,
        fixedMsg: fixedMessage,
        status: error.status,
      };
    }
  };

  const handleLogout = async () => {
    const snapshot: UserSnapshot | null = authUser
      ? {
          _id: authUser._id,
          firstName: authUser.firstName,
          lastName: authUser.lastName,
          username: authUser.lastName,
          profileImage: authUser.profileImage,
          lastRoute: currentPage,
        }
      : null;
    try {
      // Step 1: Send logout request to backend
      await fetcher("/auth/logout", { method: "POST" });

      // Step 2: Reset login status, currentPage and feedback state
      setLoginStatus("LOCKED");
      setPage("");
      setSnackBarMsgs((prev) => ({ ...prev, messgages: [], inlineMsg: null }));

      // Step 3: Check if stored user exists for drawer experience
      if (snapshot) setCookie("user_snapshot", JSON.stringify(snapshot), 20);

      const userSnapshot = getCookie("user_snapshot");
      if (userSnapshot) {
        setAuthUser(JSON.parse(userSnapshot));
      } else {
        setCurrentPage("/web/home");
        router.replace("/web/home");
        setAuthUser(null);
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return {
    checkEmail,
    handleLogin,
    handleLogout,
    loginAttempts,
    MAX_ATTEMPTS,
    lockTimestamp,
    startLockCountdown,
  };
};
