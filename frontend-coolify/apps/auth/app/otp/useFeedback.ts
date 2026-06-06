"use client";

import { useSnackbar, usePage, useGlobalStore } from "@repo/shared-hooks";
import { CACHE_KEYS, CLIENT_ROUTES, IUser } from "@repo/core";
import { queryClient } from "@repo/helpers";

export const useFeedback = () => {
  const { setSBMessage } = useSnackbar();
  const { navigateTo } = usePage();
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);

  /**
   * Success handler for Login flows. clears the transit cache.
   */
  const handleAuthOtpSuccess = (
    user?: IUser,
    onSuccessCallback?: () => void,
    transitKey = CACHE_KEYS.LOGIN_TRANSIT_DATA,
  ) => {
    // Commit user to global state while the reference is still valid
    if (user) {
      const userClone = { ...user };
      setAuthUser(userClone);
      setAuthStatus("AUTHENTICATED");
    }
    // Clear the transit cache now that the data is safely in Zustand
    queryClient.removeQueries({ queryKey: transitKey });
    // Notify User
    setSBMessage({
      msg: {
        tagline: "Verification successful!",
        msgStatus: "SUCCESS",
      },
    });

    // Handle Routing
    if (onSuccessCallback) {
      onSuccessCallback();
    } else {
      navigateTo(CLIENT_ROUTES.home, {
        loadPage: true,
        type: "replace",
      });
    }
  };

  /**
   * Success handler for Account Update flows. Typically redirects to settings or profile.
   */
  const onUpdateSuccess = () => {
    queryClient.removeQueries({
      queryKey: CACHE_KEYS.ACCOUNT_UPDATE_TRANSIT_DATA,
    });
    setSBMessage({
      msg: {
        tagline: "Security details updated successfully.",
        msgStatus: "SUCCESS",
      },
    });
    navigateTo(CLIENT_ROUTES.settings, { loadPage: true, type: "replace" });
  };

  return { handleAuthOtpSuccess, onUpdateSuccess };
};
