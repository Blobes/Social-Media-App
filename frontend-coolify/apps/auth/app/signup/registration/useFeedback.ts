"use client";

import { useStaticTranslation } from "@repo/shared-hooks";
import {
  ApiError,
  AUTH_FEEDBACK,
  CACHE_KEYS,
  IUser,
  useGlobalStore,
} from "@repo/core";
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
  const setGlobalLoading = useGlobalStore((state) => state.setGlobalLoading);
  const setAccessToken = useGlobalStore((state) => state.setAccessToken);
  const setAccountStatus = useGlobalStore((state) => state.setAccountStatus);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);
  const { handleSendOtp } = useOtp();
  const { handleOtpNavigation } = useAuthNavigation();
  const { translateTxtString } = useStaticTranslation();

  /**
   * Caches credentials and routes user to validation views upon successful container generation.
   */
  const handleSuccess = (res: SignupResponse) => {
    if (res.httpStatus !== 200) return;
    setGlobalLoading(true);

    const user = res.payload as IUser;
    if (res.status === "SUCCESS" && user) {
      setAccessToken(res.accessToken);
      setAuthStatus("AUTHENTICATED");
      setAccountStatus("NOT_VERIFIED");
      handleSendOtp({
        recipient: user.email || email,
        purpose: "SIGNUP_VERIFICATION",
        channel: "EMAIL",
      });
      handleOtpNavigation({
        user,
        identifier: user.email || email,
        inputType: "EMAIL",
        reason: "NEW_ACCOUNT",
        purpose: "SIGNUP_VERIFICATION",
        transitKey: CACHE_KEYS.AUTH_TRANSIT_DATA,
      });
      return;
    }
  };

  /**
   * Catches errors during registration and surfaces the rejection messages within the view container.
   */
  const handleError = (
    error: ApiError,
    setMsg: React.Dispatch<React.SetStateAction<React.ReactNode | null>>,
  ) => {
    setMsg(
      error.localizedErrMsg ||
        translateTxtString(AUTH_FEEDBACK.registration_failed),
    );
  };

  return { handleSuccess, handleError };
};
