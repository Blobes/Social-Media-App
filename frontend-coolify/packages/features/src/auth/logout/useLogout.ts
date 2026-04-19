"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CLIENT_ROUTES, SERVER_API } from "@repo/core";
import { apiClient } from "@repo/helpers";
import {
  useGlobalStore,
  useMisc,
  usePage,
  useSnackbar,
} from "@repo/shared-hooks";

/** * Handles the user logout flow, clearing state, cache, and redirecting. */
export const useLogout = () => {
  // Using selectors for stable references and optimized re-renders
  const setAuthUser = useGlobalStore((state) => state.setAuthUser);
  const setAuthStatus = useGlobalStore((state) => state.setAuthStatus);

  const { navigateTo } = usePage();
  const { setSBMessage, clearSBMessages } = useSnackbar();
  const { closeModal } = useMisc();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  /** * Mutation to handle the server-side logout process. */
  const { mutate: logoutMutation, isPending } = useMutation({
    mutationFn: async () => {
      return await apiClient(SERVER_API.logout, { method: "POST" });
    },
    onSuccess: () => {
      // Clear all cached queries to prevent data leaking between sessions
      queryClient.clear();

      setAuthUser(null);
      setAuthStatus("UNAUTHENTICATED");
      closeModal();

      // Handle navigation logic
      if (pathname !== CLIENT_ROUTES.home.path) {
        navigateTo(CLIENT_ROUTES.home, {
          loadPage: true,
        });
      } else {
        router.refresh();
      }
    },
    onError: (error: any) => {
      setSBMessage({
        msg: { content: error.message, msgStatus: "ERROR" },
      });
      console.error("Logout failed:", error);
    },
    onSettled: () => {
      // Reset feedback state regardless of outcome
      clearSBMessages();
    },
  });

  /** * Memoized logout handler to be used in UI components. */
  const handleLogout = useCallback(() => {
    logoutMutation();
  }, [logoutMutation]);

  return {
    handleLogout,
    isLoggingOut: isPending,
  };
};
