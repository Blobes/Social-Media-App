"use client";

import { useSnackbar, usePage, useStaticTranslation } from "@repo/shared-hooks";
import {
  AUTH_FEEDBACK,
  CLIENT_ROUTES,
  IUser,
  STORAGE_KEYS,
  TransitData,
  useGlobalStore,
} from "@repo/core";
import { queryClient } from "@repo/helpers";

export const useFeedback = () => {
  const { setSBMessage } = useSnackbar();
  const { navigateTo } = usePage();
  const { translateTxtString } = useStaticTranslation();
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);
  const setAccountStatus = useGlobalStore((state) => state.setAccountStatus);

  /**
   * Success handler for Login flows. clears the transit cache.
   */
  const handleAuthOtpSuccess = (
    user?: IUser,
    onSuccessCallback?: () => void,
  ) => {
    // Commit user to global state while the reference is still valid
    if (user) {
      const userClone = { ...user };
      setAuthUser(userClone);
      setAuthStatus("AUTHENTICATED");

      // Clear the transit cache now that the data is safely in Zustand
      queryClient.removeQueries({ queryKey: STORAGE_KEYS.AUTH_TRANSIT });

      // Notify User
      setSBMessage({
        msg: {
          tagline: translateTxtString(
            AUTH_FEEDBACK.verification_successful_tagline,
          ),
          msgStatus: "SUCCESS",
        },
      });

      // Handle Routing
      if (onSuccessCallback) onSuccessCallback();

      if (!userClone.isOnboarded) {
        setAccountStatus("NOT_ONBOARDED");
        navigateTo(CLIENT_ROUTES.onboarding, {
          loadPage: true,
        });
      }
    } else {
      setAccountStatus("ACTIVE");
      navigateTo(CLIENT_ROUTES.home, { loadPage: true, type: "replace" });
    }
  };

  /**
   * Success handler for Account Update flows. Typically redirects to settings or profile.
   */
  const onUpdateSuccess = () => {
    queryClient.removeQueries({
      queryKey: STORAGE_KEYS.ACCOUNT_UPDATE_TRANSIT,
    });
    setSBMessage({
      msg: {
        tagline: translateTxtString(
          AUTH_FEEDBACK.security_details_updated_tagline,
        ),
        msgStatus: "SUCCESS",
      },
    });
    navigateTo(CLIENT_ROUTES.settings, { loadPage: true, type: "replace" });
  };

  /**
   * Success handler for Account Update flows. Typically redirects to settings or profile.
   */
  const handlePassResetSuccess = (identifier?: string) => {
    const transitData: TransitData<"PASSWORD_RESET"> = {
      _id: "transit:otp-auth",
      purpose: "PASSWORD_RESET",
      payload: { nextStep: "NEW_PASSWORD", identifier },
    };
    queryClient.setQueryData(
      STORAGE_KEYS.PASS_RESET_FINALIZED_TRANSIT,
      transitData,
    );

    setSBMessage({
      msg: {
        tagline: translateTxtString(
          AUTH_FEEDBACK.verification_successful_tagline,
        ),
        msgStatus: "SUCCESS",
      },
    });
    queryClient.removeQueries({
      queryKey: STORAGE_KEYS.PASS_RESET_INIT_TRANSIT,
    });

    navigateTo(CLIENT_ROUTES.resetPassword, {
      loadPage: true,
      type: "replace",
    });
  };

  return { handleAuthOtpSuccess, onUpdateSuccess, handlePassResetSuccess };
};
