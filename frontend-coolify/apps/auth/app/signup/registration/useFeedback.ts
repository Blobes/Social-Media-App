"use client";

import { usePage, useGlobalStore } from "@repo/shared-hooks";
import { CACHE_KEYS, CLIENT_ROUTES, IUser } from "@repo/core";
import { SignupResponse } from "../service";
import { useOtp } from "../../otp/useOtp";
import { useAuthNavigation } from "@repo/features";

interface UseSignupFeedbackProps {
  email: string;
}

/**
 * Handles post-registration state logic, global store state allocation, and navigation routing.
 */
export const useSignupFeedback = ({ email }: UseSignupFeedbackProps) => {
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const setGlobalLoading = useGlobalStore((state) => state.setGlobalLoading);
  const setAccessToken = useGlobalStore((state) => state.setAccessToken);
  const { handleSendOtp } = useOtp();
  const { handleVerifyOtp } = useAuthNavigation();

  /**
   * Caches credentials and routes user to validation views upon successful container generation.
   */
  const handleSuccess = (res: SignupResponse) => {
    if (res.httpStatus !== 200) return;
    setGlobalLoading(true);

    const user = res.payload as IUser;
    if (res.status === "SUCCESS" && user) {
      setAccessToken(res.accessToken);

      handleSendOtp({
        recipient: user.email || email,
        purpose: "SIGNUP_VERIFICATION",
        channel: "EMAIL",
      });
      handleVerifyOtp(
        user,
        user.email || email,
        "EMAIL",
        "NEW_ACCOUNT",
        "SIGNUP_VERIFICATION",
        CACHE_KEYS.SIGNUP_TRANSIT_DATA,
      );
      return;
    }
  };

  /**
   * Catches errors during registration and surfaces the rejection messages within the view container.
   */
  const handleError = (error: any) => {
    setInlineMsg(
      error.message || "Registration failed. Please verify your entries.",
    );
  };

  return { handleSuccess, handleError };
};
