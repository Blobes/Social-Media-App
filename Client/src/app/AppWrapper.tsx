"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Stack } from "@mui/material";
import { BlurEffect } from "../components/BlurEffect";
import { Header } from "@/navbars/top-navbar/Header";
import { SnackBars } from "@/components/SnackBars";
import { useAppContext } from "./AppContext";
import { Footer } from "@/components/Footer";
import { Modal, ModalRef } from "@/components/Modal";
import { useSharedHooks } from "@/hooks";
import { AuthStepper } from "./auth/login/AuthStepper";
import { verifyAuth } from "./auth/verifyAuth";
import { defaultPage, flaggedRoutes } from "@/helpers/info";
import { matchPaths } from "@/helpers/others";

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();

  // Always initialize hooks here — top of the component
  const modalRef = useRef<ModalRef>(null);
  const { setSBMessage, setLastPage } = useSharedHooks();
  const {
    snackBarMsgs,
    loginStatus,
    setLoginStatus,
    modalContent,
    setModalContent,
    setAuthUser,
    lastPage,
  } = useAppContext();
  const [mounted, setMounted] = useState(false);

  const flaggedAppRoutes = flaggedRoutes.app.filter((route) =>
    matchPaths(pathname, route)
  );

  const isAllowedRoutes = [
    ...flaggedRoutes.auth,
    ...flaggedRoutes.web,
    ...flaggedAppRoutes,
  ].includes(pathname);
  const isAllowedAuthRoutes = flaggedRoutes.auth.includes(pathname);

  // ─────────────────────────────
  // 1️⃣ MOUNT + INITIAL AUTH CHECK
  // ─────────────────────────────
  useEffect(() => {
    setMounted(true);

    verifyAuth({
      setAuthUser,
      setLoginStatus,
      setSBMessage,
      setLastPage,
      pathname,
      isAllowedAuthRoutes,
    });
  }, []);

  // ─────────────────────────────
  // 2️⃣ AUTH STATE REACTIONS
  // ─────────────────────────────
  useEffect(() => {
    // Handle modal based on loginStatus
    // if (loginStatus === "LOCKED" && !isExcludedRoute) {
    //   setModalContent({ content: <AuthStepper />, shouldClose: false });
    // } else {
    //   setModalContent(null);
    // }
    if (loginStatus === "AUTHENTICATED" || modalContent) {
      setModalContent(null);
      return;
    }

    if (!isAllowedRoutes) {
      router.replace(defaultPage.path);
      return;
    }

    const showModal = () =>
      setModalContent({
        content: <AuthStepper />,
        onClose: () => setModalContent(null),
      });

    showModal(); // Show modal first
    const id = setInterval(showModal, 10 * 60 * 1000);

    return () => clearInterval(id);
  }, [loginStatus]);

  // ─────────────────────────────
  // 3️⃣ MODAL OPEN / CLOSE
  // ─────────────────────────────
  useEffect(() => {
    if (modalContent) {
      modalRef.current?.openModal();
    } else {
      modalRef.current?.closeModal();
    }
  }, [modalContent]);

  //─────────────────────────────
  // 4️⃣ BROWSER EVENTS
  // ─────────────────────────────
  useEffect(() => {
    const reverify = async () =>
      await verifyAuth({
        setAuthUser,
        setLoginStatus,
        setSBMessage,
        setLastPage: setLastPage,
        pathname,
        isAllowedAuthRoutes,
      });

    const handleOnline = () => {
      setSBMessage({
        msg: {
          content: "You are now online",
          msgStatus: "SUCCESS",
        },
        override: true,
      });
      reverify();
    };

    const handleOffline = () => {
      setSBMessage({
        msg: {
          title: "No internet connection",
          content: "Check your network and refresh the page",
          msgStatus: "ERROR",
          behavior: "FIXED",
          hasClose: true,
          cta: {
            label: "Refresh",
            action: () => window.location.reload(),
          },
        },
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") reverify();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", reverify);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", reverify);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [pathname, lastPage]);

  if (!mounted || loginStatus === "UNKNOWN") {
    return null; // or splash loader
  }
  return (
    <Stack sx={{ position: "fixed", height: "100vh", width: "100%", gap: 0 }}>
      <BlurEffect />
      {!isAllowedAuthRoutes && <Header />}
      {snackBarMsgs.messgages && <SnackBars snackBarMsg={snackBarMsgs} />}
      {children}
      {modalContent && (
        <Modal
          ref={modalRef}
          content={modalContent.content}
          header={modalContent.header}
          shouldClose={modalContent.shouldClose}
          entryDir={modalContent.entryDir ?? "CENTER"}
          style={modalContent.style}
          onClose={modalContent.onClose}
        />
      )}
      <Footer />
    </Stack>
  );
};
