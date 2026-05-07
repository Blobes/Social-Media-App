"use client";

import React from "react";
import { useEffect, useRef } from "react";
import { useEventListener, useGlobalStore, useMisc } from "@repo/shared-hooks";
import { useAuthVerification } from "../apps/auth/login/useAuthVerification";

/**
 * Manages the application authentication lifecycle and initialization.
 */
export const AuthManager = ({ children }: { children: React.ReactNode }) => {
  const { verifyAuth } = useAuthVerification();
  const { verifySignal } = useMisc();
  const setGlobalLoading = useGlobalStore((state) => state.setGlobalLoading);
  const isMounted = useRef(false);

  // Registering global events on mount
  useEventListener(verifyAuth);

  useEffect(() => {
    const init = async () => {
      // Prevent double-initialization in Strict Mode
      if (isMounted.current) return;
      isMounted.current = true;
      try {
        setGlobalLoading(true);
        await verifySignal();
        await verifyAuth();
      } catch (error) {
        console.error(" Auth Initialization Failed:", error);
      } finally {
        setGlobalLoading(false);
      }
    };
    init();
  }, [verifyAuth, verifySignal]);

  return <>{children}</>;
};
