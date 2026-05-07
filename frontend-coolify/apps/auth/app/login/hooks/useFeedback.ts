"use client";

import { usePage, useGlobalStore } from "@repo/shared-hooks";
import { getFromLocalStorage } from "@repo/helpers";
import { CLIENT_ROUTES, IPage, IUser, OtpChannel } from "@repo/core";
import { clearLoginLock, useAuthNavigation } from "@repo/features";
import { UseLogin } from "./useLogin";
import { LoginResponse } from "../service";
import { useIdentifier } from "./useIdentifier";
import { useOtp } from "../../otp/useOtp";

export const useLoginFeedback = ({ identifier, setStep }: UseLogin) => {
  const { navigateTo, isOnWeb } = usePage();
  const { handleSendOtp } = useOtp();
  const { inputType } = useIdentifier({ existingInput: identifier });
  const { handleNotOnboarded, handleOtpRequired } = useAuthNavigation();

  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const setGlobalLoading = useGlobalStore((state) => state.setGlobalLoading);
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);

  /**
   * Processes successful login and routes based on account state.
   */
  const handleSuccess = async (res: LoginResponse) => {
    if (res.httpStatus !== 200) return;

    setGlobalLoading(true);

    const user = res.payload as IUser;
    clearLoginLock();

    // Handling deactivated accounts immediately
    if (res.status === "DEACTIVATED") {
      setAuthStatus("DEACTIVATED");
      if (setStep) setStep("RESTORE_ACCOUNT");
      setGlobalLoading(false);
      return;
    }

    if (res.status === "SUCCESS" && user) {
      // OTP Verification Flow for logging in after a while or untrusted hardware
      if (res.requireOtp) {
        handleSendOtp({
          recipient: user.email || user.phoneNumber || identifier,
          purpose: "LOGIN",
          channel: (inputType as OtpChannel) || "EMAIL",
        });
        handleOtpRequired(
          user,
          identifier,
          inputType as OtpChannel,
          res.otpReason,
        );
        return;
      }

      // Handling users who haven't completed onboarding steps
      if (!user.isOnboarded) {
        setAuthStatus("NOT_ONBOARDED");
        handleNotOnboarded(user);
        return;
      }

      // Finalizing redirect for fully verified and onboarded users
      setAuthUser(user);
      setAuthStatus("AUTHENTICATED");
      // if (setStep) setStep("IDENTIFIER");

      const savedPage = getFromLocalStorage<IPage>();
      const destination =
        savedPage && !isOnWeb(savedPage.path) ? savedPage : CLIENT_ROUTES.home;
      navigateTo(destination);
    }
  };

  /**
   * Processes authentication failures and manages lockout messaging.
   */
  const handleError = (error: any, handleFailedPassword: () => void) => {
    const isPasswordErr = error.status === "UNAUTHORIZED";
    if (isPasswordErr) {
      handleFailedPassword();
    } else {
      setInlineMsg(error.message || "Login failed");
    }
  };

  return { handleSuccess, handleError };
};
