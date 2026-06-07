"use client";

import React, { useEffect, useRef } from "react";
import {
  Drawer,
  Modal,
  SnackBars,
  PageLoaderUI,
  OfflinePromptUI,
  NetworkGlitchUI,
} from "@repo/shared-ui";
import { usePathname } from "next/navigation";
import { registerSW, delay, getFromLocalStorage } from "@repo/helpers";
import {
  useEventListener,
  useGlobalStore,
  useMisc,
  useOffline,
  usePage,
  useSnackbar,
} from "@repo/shared-hooks";
import { AuthStatus, DrawerRef, ModalRef } from "@repo/core";
import { useAuthVerification } from "../apps/auth/login/useAuthVerification";
import { RestrictedUI } from "../components/RestrictedUI";

export interface UIManagerProps {
  children: React.ReactNode;
  showOfflineUI?: boolean;
  showNetworkErrorUI?: boolean;
}

/** * Manages the global UI state, including modals, drawers, snackbars, and system-level screens.
 * Orchestrates the initial app boot sequence.
 */
export const GlobalUIManager = ({
  children,
  showOfflineUI = true,
  showNetworkErrorUI = true,
}: UIManagerProps) => {
  const drawerRef = useRef<DrawerRef>(null);
  const modalRef = useRef<ModalRef>(null);

  // Destructuring state and actions from the Zustand store
  const snackBarMsg = useGlobalStore((state) => state.snackBarMsgs);
  const drawerContent = useGlobalStore((state) => state.drawerContent);
  const modalContent = useGlobalStore((state) => state.modalContent);
  const isGlobalLoading = useGlobalStore((state) => state.isGlobalLoading);
  const authStatus = useGlobalStore((state) => state.authStatus);
  const networkStatus = useGlobalStore((state) => state.networkStatus);
  const setGlobalLoading = useGlobalStore((state) => state.setGlobalLoading);
  const offlineMode = useGlobalStore((state) => state.offlineMode);
  const checkingSignal = useGlobalStore((state) => state.checkingSignal);
  const accountStatus = useGlobalStore((state) => state.accountStatus);

  const { verifySignal, isUnstableNetwork, isOffline } = useMisc();
  const {
    handlePageChange,
    isRedirecting,
    isNavigating,
    needsLogin,
    needsOnboarding,
    needsRestoreAccount,
    needsOtpVerification,
  } = usePage();
  const pathname = usePathname();
  const { verifyAuth } = useAuthVerification();
  const { setSBTimer, removeSBMessages } = useSnackbar();
  const { switchToOfflineMode } = useOffline();
  const isMounted = useRef(false);

  // Registering global events on mount
  useEventListener(verifyAuth);

  // Handles the application initialization sequence.
  useEffect(() => {
    const init = async () => {
      if (isMounted.current) return;
      isMounted.current = true;
      try {
        setGlobalLoading(true);
        registerSW();
        await verifySignal();
        await verifyAuth();
      } finally {
        await delay();
        setGlobalLoading(false);
      }
    };
    init();
  }, [verifyAuth, verifySignal]);

  // Global timer
  useEffect(() => {
    const heartbeat = setInterval(() => {
      useGlobalStore.getState().updateNow();
    }, 60000); // The "Pulse"
    return () => clearInterval(heartbeat);
  }, []);

  // Syncs the local refs for Drawer and Modal with the global Zustand state.
  useEffect(() => {
    if (!drawerContent) drawerRef.current?.closeDrawer();
    if (!modalContent) modalRef.current?.closeModal();

    requestAnimationFrame(() => {
      if (drawerContent) drawerRef.current?.openDrawer();
      if (modalContent) modalRef.current?.openModal();
    });
  }, [drawerContent, modalContent]);

  // Responds to route changes to update internal page tracking and act as route guard.
  useEffect(() => {
    handlePageChange();
  }, [pathname, authStatus, accountStatus]);

  // Determining if the app is still in its initial boot state
  const showLoaderUI =
    !isMounted.current ||
    authStatus === "PENDING" ||
    networkStatus === "UNKNOWN" ||
    isNavigating ||
    isGlobalLoading;
  if (showLoaderUI) return <PageLoaderUI />;

  if (!isNavigating && !isRedirecting) {
    if (needsLogin) return <RestrictedUI type="NEEDS_LOGIN" />;
    if (needsOtpVerification)
      return <RestrictedUI type="NEEDS_OTP_VERIFICATION" />;
    if (needsOnboarding) return <RestrictedUI type="NEEDS_ONBOARDING" />;
    if (needsRestoreAccount) return <RestrictedUI type="NEEDS_RESTORE" />;
  }

  const savedLoginStatus = getFromLocalStorage<AuthStatus>({
    key: "last_auth_status",
  });
  const wasLoggedIn = savedLoginStatus === "AUTHENTICATED";
  // Update the condition
  const shouldShowOffline =
    showOfflineUI && isOffline && !offlineMode && wasLoggedIn;

  if (shouldShowOffline) {
    return <OfflinePromptUI handleOffline={switchToOfflineMode} />;
  }

  // Logic for displaying Network Glitches or Critical Auth Errors
  const hasNetworkGlitch = isUnstableNetwork && !isOffline;
  const hasAuthError = authStatus === "ERROR";
  const isGuestOffline = isOffline && !wasLoggedIn;

  if (
    showNetworkErrorUI &&
    (hasNetworkGlitch || hasAuthError || isGuestOffline)
  ) {
    return (
      <NetworkGlitchUI
        checkingSignal={checkingSignal}
        isUnstableNetwork={isUnstableNetwork}
      />
    );
  }

  // Main UI rendering with portal-like overlays
  return (
    <>
      {children}
      {snackBarMsg.messages && snackBarMsg.messages.length > 0 && (
        <SnackBars
          snackBarMsg={snackBarMsg}
          removeMessage={removeSBMessages}
          setSBTimer={setSBTimer}
        />
      )}
      {drawerContent && <Drawer ref={drawerRef} {...drawerContent} />}
      {modalContent && <Modal ref={modalRef} {...modalContent} />}
    </>
  );
};
