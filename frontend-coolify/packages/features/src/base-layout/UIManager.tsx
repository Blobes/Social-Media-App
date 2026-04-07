"use client";

import React, { useEffect, useRef } from "react";
import { Drawer, Modal, SnackBars, PageLoaderUI } from "@repo/shared-ui";
import { usePathname } from "next/navigation";
import { registerSW, delay, cleanupCache } from "@repo/helpers";
import {
  useEventListener,
  useGlobalContext,
  useMisc,
  usePage,
  useSnackbar,
} from "@repo/shared-state";
import { DrawerRef, ModalRef } from "@repo/types";
import { useAuth } from "../auth/useAuth";
export const UIManager = ({ children }: { children: React.ReactNode }) => {
  const drawerRef = useRef<DrawerRef>(null);
  const modalRef = useRef<ModalRef>(null);
  const { openDrawer, openModal, verifySignal } = useMisc();
  const { handleCurrentPage } = usePage();
  const {
    snackBarMsg,
    drawerContent,
    modalContent,
    isGlobalLoading,
    authStatus,
    networkStatus,
    setGlobalLoading,
  } = useGlobalContext();
  const pathname = usePathname();
  const { verifyAuth } = useAuth();
  const { setSBTimer, removeSBMessage } = useSnackbar();

  // Register events
  useEventListener(verifyAuth);

  useEffect(() => {
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

  // // Page Load Handler
  useEffect(() => {
    handleCurrentPage();
  }, [pathname]);

  // Page loader UI
  const isInitializing =
    isGlobalLoading || authStatus === "PENDING" || networkStatus === "UNKNOWN";
  if (isInitializing) return <PageLoaderUI />;

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
