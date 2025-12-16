"use client";

import { useAppContext } from "@/app/AppContext";
import { useSharedHooks } from "@/hooks";
import { fetcher } from "@/helpers/fetcher";
import { IUser, SavedPage, SingleResponse, UserSnapshot } from "@/types";
import { useRouter } from "next/navigation";
import {
  deleteCookie,
  extractPageTitle,
  getCookie,
  getFromLocalStorage,
  setCookie,
} from "@/helpers/others";
import {
  clearLoginLock,
  formatRemainingTime,
  getLockRemaining,
} from "@/helpers/auth";
import { useRef } from "react";
import { defaultPage, excludedRoutes } from "@/helpers/info";

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
    setSnackBarMsgs,
    setInlineMsg,
  } = useAppContext();
  const { setSBMessage, setLastPage } = useSharedHooks();
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
    // Step 1: Check if user is locked
    const isLocked = loginAttempts >= MAX_ATTEMPTS && lockTimestamp;
    const remainingSec = isLocked
      ? getLockRemaining(lockTimestamp, LOCKOUT_MIN)
      : 0;
    if (remainingSec <= 0) clearLoginLock();

    try {
      // Login request
      const res = await fetcher<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      const { payload, message, status } = res;
      if (!payload || status !== "SUCCESS") return null;

      setAuthUser(payload);
      setLoginStatus("AUTHENTICATED");

      const currentPath = window.location.pathname;
      const isExcludedRoute = excludedRoutes.auth.includes(currentPath);

      const fallbackPage = { title: "timeline", path: "/timeline" };
      if (isExcludedRoute) {
        setLastPage(fallbackPage);
      } else {
        const savedPage = getFromLocalStorage<SavedPage>() ?? fallbackPage;
        setLastPage(savedPage);
      }

      //Clear cookies
      deleteCookie("user_snapshot");
      deleteCookie("loginAttempts");

      return { payload, message, status };
    } catch (error: any) {
      // Step 4: Handle failure
      const msg = error.message || "";
      const isPasswordErr = msg.toLowerCase().includes("password");

      if (isPasswordErr) {
        setCookie("loginAttempts", String(loginAttempts + 1), LOCKOUT_MIN);
      }

      let fixedMessage = msg;
      if (isPasswordErr && loginAttempts + 1 < MAX_ATTEMPTS) {
        fixedMessage = `Wrong password. You have ${
          MAX_ATTEMPTS - loginAttempts - 1
        } attempt(s) left.`;
      } else if (isPasswordErr && loginAttempts + 1 >= MAX_ATTEMPTS) {
        const lockTime = Date.now();
        setCookie("loginLockTime", String(lockTime), LOCKOUT_MIN);
        startLockCountdown(lockTime);
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
        }
      : null;
    let pagePath;
    try {
      // Step 1: Send logout request to backend
      await fetcher("/auth/logout", { method: "POST" });

      // Step 2: Check if stored user exists for drawer experience
      if (snapshot) setCookie("user_snapshot", JSON.stringify(snapshot), 20);

      const userSnapshot = getCookie("user_snapshot");

      if (userSnapshot) {
        const parsed = JSON.parse(userSnapshot);
        setAuthUser(parsed);

        pagePath = window.location.pathname;
        setLastPage({ title: extractPageTitle(pagePath), path: pagePath });

        setLoginStatus("LOCKED");
      } else {
        setAuthUser(null);
        setLastPage({ title: defaultPage.title, path: defaultPage.path });
        setLoginStatus("UNAUTHENTICATED");
        router.replace(defaultPage.path);
      }
    } catch (error: any) {
      setSBMessage({
        msg: { content: error.message, msgStatus: "ERROR" },
      });
      console.error("Logout failed:", error);
    }
    //Reset feedback state
    setSnackBarMsgs((prev) => ({ ...prev, messgages: [], inlineMsg: null }));
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
