"use client";

import { usePage, useStaticTranslation } from "@repo/shared-hooks";
import { clearLoginLock, getFromLocalStorage } from "@repo/helpers";
import {
  ApiError,
  AUTH_FEEDBACK,
  CLIENT_ROUTES,
  IPage,
  IUser,
  OtpChannel,
  useGlobalStore,
} from "@repo/core";
import { useAuthNavigation } from "@repo/features";
import { UseLogin } from "./useLogin";
import { LoginResponse } from "../service";
import { useIdentifier } from "./useIdentifier";
import { useOtp } from "../../otp/useOtp";

export const useLoginFeedback = ({ identifier, setStep }: UseLogin) => {
  const { navigateTo, isOnWeb } = usePage();
  const { handleSendOtp } = useOtp();
  const { inputType } = useIdentifier({ existingInput: identifier });
  const { handleOtpNavigation } = useAuthNavigation();
  const { translateTxtString } = useStaticTranslation();

  const setGlobalLoading = useGlobalStore((state) => state.setGlobalLoading);
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);
  const setAccountStatus = useGlobalStore((state) => state.setAccountStatus);
  const setAccessToken = useGlobalStore((state) => state.setAccessToken);

  /**
   * Processes successful login and routes based on account state.
   */
  const handleSuccess = async (res: LoginResponse) => {
    if (res.httpStatus !== 200) return;
    clearLoginLock();
    setGlobalLoading(true);

    const user = res.payload as IUser;
    if (res.status === "SUCCESS" && user) {
      setAccessToken(res.accessToken);
      // OTP Verification Flow for logging in after a while or untrusted hardware
      if (res.requireOtp) {
        setAccountStatus("NOT_VERIFIED");
        handleSendOtp({
          recipient: user.email || user.phoneNumber || identifier,
          purpose: "ACCOUNT_VERIFICATION",
          channel: (inputType as OtpChannel) || "EMAIL",
        });
        handleOtpNavigation({
          user,
          identifier,
          inputType: inputType as OtpChannel,
          reason: res.otpReason,
        });
        return;
      }

      setAuthUser(user);
      setAuthStatus("AUTHENTICATED");

      // Handling deactivated accounts immediately
      if (user.accountStatus === "DEACTIVATED") {
        setAccountStatus("DEACTIVATED");
        if (setStep) setStep("RESTORE_ACCOUNT");
        setGlobalLoading(false);
        return;
      }

      // Handling users who haven't completed onboarding steps
      if (!user.isOnboarded) {
        setAccountStatus("NOT_ONBOARDED");
        navigateTo(CLIENT_ROUTES.onboarding, { loadPage: true });
        return;
      }

      // Finalizing redirect for fully verified and onboarded users
      const savedPage = getFromLocalStorage<IPage>();
      const destination =
        savedPage && !isOnWeb(savedPage.path) ? savedPage : CLIENT_ROUTES.home;
      navigateTo(destination);
    }
  };

  /**
   * Processes authentication failures and manages lockout messaging.
   */
  const handleError = (
    error: ApiError,
    handleFailedAttempts: () => void,
    setMsg: React.Dispatch<React.SetStateAction<React.ReactNode | null>>,
  ) => {
    const isPasswordErr = error.status === "UNAUTHORIZED";
    if (isPasswordErr) {
      handleFailedAttempts();
    } else {
      setMsg(
        error.localizedErrMsg || translateTxtString(AUTH_FEEDBACK.login_failed),
      );
    }
  };

  return { handleSuccess, handleError };
};
