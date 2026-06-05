"use client";

import { usePage, useGlobalStore } from "@repo/shared-hooks";
import { CLIENT_ROUTES, IUser } from "@repo/core";
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
  const { navigateTo } = usePage();
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const setGlobalLoading = useGlobalStore((state) => state.setGlobalLoading);
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);
  const setAccountStatus = useGlobalStore((state) => state.setAccountStatus);
  const setAccessToken = useGlobalStore((state) => state.setAccessToken);
  const { handleSendOtp } = useOtp();
  const { handleOtpRequired } = useAuthNavigation();

  /**
   * Caches credentials and routes user to validation views upon successful container generation.
   */
  const handleSuccess = (res: SignupResponse) => {
    if (res.httpStatus !== 200) return;
    setGlobalLoading(true);

    const user = res.payload as IUser;
    if (res.status === "SUCCESS" && user) {
      // Committing credentials into state to prevent subsequent re-authentication demands
      setAuthUser(user);
      setAuthStatus("AUTHENTICATED");
      setAccessToken(res.accessToken);

      if (user.isDeactivated) {
        setAccountStatus("DEACTIVATED");
        navigateTo(CLIENT_ROUTES.login);
        setGlobalLoading(false);
        return;
      }
      handleSendOtp({
        recipient: user.email || email,
        purpose: "LOGIN_VERIFICATION",
        channel: "EMAIL",
      });
      handleOtpRequired(user, user.email || email, "EMAIL", "NEW_ACCOUNT");

      setGlobalLoading(false);
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
