"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Drawer,
  Modal,
  SnackBars,
  PageLoaderUI,
  OfflinePromptUI,
  NetworkGlitchUI,
  SplashUI,
} from "@repo/shared-ui";
import { usePathname } from "next/navigation";
import {
  registerSW,
  delay,
  cleanupCache,
  getFromLocalStorage,
} from "@repo/helpers";
import {
  useEventListener,
  useGlobalContext,
  useMisc,
  useOffline,
  usePage,
  useSnackbar,
} from "@repo/shared-state";
import { AuthStatus, DrawerRef, ModalRef } from "@repo/core";
import { useAuth } from "../auth/login/useAuth";

export interface UIManagerProps {
  children: React.ReactNode;
  showOfflineUI?: boolean;
  showNetworkErrorUI?: boolean;
}

export const GlobalUIManager = ({
  children,
  showOfflineUI = true,
  showNetworkErrorUI = true,
}: UIManagerProps) => {
  const drawerRef = useRef<DrawerRef>(null);
  const modalRef = useRef<ModalRef>(null);
  const { openDrawer, openModal, verifySignal, isUnstableNetwork, isOffline } =
    useMisc();
  const { handleCurrentPage } = usePage();
  const {
    snackBarMsg,
    drawerContent,
    modalContent,
    isGlobalLoading,
    authStatus,
    networkStatus,
    setGlobalLoading,
    offlineMode,
    checkingSignal,
  } = useGlobalContext();
  const pathname = usePathname();
  const { verifyAuth } = useAuth();
  const { setSBTimer, removeSBMessage } = useSnackbar();
  const { switchToOfflineMode } = useOffline();

  const [isMounted, setIsMounted] = useState(false);

  // Register events
  useEventListener(verifyAuth);

  useEffect(() => {
    setIsMounted(true);

    const init = async () => {
      try {
        setGlobalLoading(true);
        registerSW();
        await delay();
        await verifySignal();
        await verifyAuth();
      } finally {
        setGlobalLoading(false);
        cleanupCache();
      }
    };
    init();
  }, []);

  // Drawer & Modal Open / Close
  useEffect(() => {
    if (!drawerContent) drawerRef.current?.closeDrawer();
    if (!modalContent) modalRef.current?.closeModal();

    requestAnimationFrame(() => {
      if (drawerContent) drawerRef.current?.openDrawer();
      if (modalContent) modalRef.current?.openModal();
    });
  }, [drawerContent, openDrawer, modalContent, openModal]);

  // Page Load Handler
  useEffect(() => {
    handleCurrentPage();
  }, [pathname]);

  // Splash UI
  if (!isMounted) return <SplashUI />;

  // Page loader UI
  const isInitializing =
    isGlobalLoading || authStatus === "PENDING" || networkStatus === "UNKNOWN";
  if (isInitializing) return <PageLoaderUI />;

  const isLastLoggedOut =
    getFromLocalStorage<AuthStatus>({ key: "last_auth_status" }) ===
    "UNAUTHENTICATED";

  // Handle Offline State
  const shouldShowOffline =
    showOfflineUI && isOffline && !offlineMode && !isLastLoggedOut;
  if (shouldShowOffline) {
    return <OfflinePromptUI handleOffline={switchToOfflineMode} />;
  }
  // Handle Network Stability or Auth Failures
  const hasNetworkGlitch =
    showNetworkErrorUI && isUnstableNetwork && !isOffline;
  const hasAuthError = authStatus === "ERROR";
  const isGuestOffline = isOffline && isLastLoggedOut;

  if (hasNetworkGlitch || hasAuthError || isGuestOffline) {
    return (
      <NetworkGlitchUI
        checkingSignal={checkingSignal}
        isUnstableNetwork={isUnstableNetwork}
      />
    );
  }

  // Render the app UIs
  return (
    <>
      {children}
      {snackBarMsg.messages && (
        <SnackBars
          snackBarMsg={snackBarMsg}
          removeMessage={removeSBMessage}
          setSBTimer={setSBTimer}
        />
      )}
      {drawerContent && <Drawer ref={drawerRef} {...drawerContent} />}
      {modalContent && <Modal ref={modalRef} {...modalContent} />}
    </>
  );
};
