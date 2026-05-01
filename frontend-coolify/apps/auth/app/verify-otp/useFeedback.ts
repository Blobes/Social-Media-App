"use client";

import { useSnackbar, usePage } from "@repo/shared-hooks";
import { CACHE_KEYS, CLIENT_ROUTES, IPage } from "@repo/core";
import { queryClient } from "@repo/helpers";

export const useFeedback = () => {
  const { setSBMessage } = useSnackbar();
  const { navigateTo } = usePage();

  /**
   * Success handler for Login flows. Navigates back to login and clears the transit cache.
   */
  const onLoginSuccess = () => {
    // Clear transit cache
    queryClient.removeQueries({ queryKey: CACHE_KEYS.LOGIN_TRANSIT_DATA });

    // Notify User
    setSBMessage({
      msg: {
        tagline:
          "Verification successful! Please enter your password to login.",
        msgStatus: "SUCCESS",
      },
    });

    // Navigate to Password Step
    const loginPath = `${CLIENT_ROUTES.login.path}?step=PASSWORD`;
    navigateTo({ title: CLIENT_ROUTES.login.title, path: loginPath } as IPage, {
      loadPage: true,
      type: "replace",
    });
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

  return { onLoginSuccess, onUpdateSuccess };
};
