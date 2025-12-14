"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Stack } from "@mui/material";
import { BlurEffect } from "../components/BlurEffect";
import { Header } from "@/components/app-navbar/Header";
import { SnackBars } from "@/components/SnackBars";
import { useAppContext } from "./AppContext";
import { Footer } from "@/components/Footer";
import { Modal, ModalRef } from "@/components/Modal";
import { useSharedHooks } from "@/hooks";
import { AuthStepper } from "./auth/login/AuthStepper";
import { verifyAuth } from "./auth/verifyAuth";
import { getCookie } from "@/helpers/others";

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();

  // Always initialize hooks here — top of the component
  const modalRef = useRef<ModalRef>(null);
  const { setSBMessage, setCurrentPage } = useSharedHooks();
  const {
    snackBarMsgs,
    setAuthUser,
    loginStatus,
    setLoginStatus,
    setInlineMsg,
    currentPage,
    setPage,
    modalContent,
    setModalContent,
  } = useAppContext();

  // Client-only UI rendering
  const [mounted, setMounted] = useState(false);

  const excludedRoutes = ["/auth/login", "/auth/signup", "/web/home"];
  const isExcludedRoute = excludedRoutes.includes(pathname);

  // ─────────────────────────────
  // 1️⃣ MOUNT + INITIAL AUTH CHECK
  // ─────────────────────────────
  useEffect(() => {
    setMounted(true);
    verifyAuth(useAppContext, useSharedHooks);
  }, []);

  // ─────────────────────────────
  // 2️⃣ AUTH STATE REACTIONS
  // ─────────────────────────────
  useEffect(() => {
    if (!mounted) return;

    const snapshotCookie = getCookie("user_snapshot");
    const userSnapshot = snapshotCookie ? JSON.parse(snapshotCookie) : null;

    if (loginStatus === "AUTHENTICATED") {
      setCurrentPage(userSnapshot.lastRoute || "timeline");
      router.replace(userSnapshot.lastRoute || "/timeline");
      setModalContent(null);
      return;
    }

    if (loginStatus === "LOCKED" && !isExcludedRoute) {
      setModalContent({
        content: <AuthStepper />,
        shouldClose: false,
      });
      return;
    }

    if (loginStatus === "UNAUTHENTICATED" && !isExcludedRoute) {
      setCurrentPage("home");
      router.replace("/web/home");
    }
  }, [mounted, loginStatus]);

  // ─────────────────────────────
  // 3️⃣ MODAL OPEN / CLOSE
  // ─────────────────────────────
  useEffect(() => {
    if (!mounted) return;

    if (modalContent) {
      modalRef.current?.openModal();
    } else {
      modalRef.current?.closeModal();
    }
  }, [modalContent, mounted]);

  //─────────────────────────────
  // 4️⃣ BROWSER EVENTS
  // ─────────────────────────────
  useEffect(() => {
    if (!mounted) return;

    const reverify = () => verifyAuth(useAppContext, useSharedHooks);

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
  }, [mounted]);

  // All client-only or window-dependent logic goes inside useEffect
  // useEffect(() => {
  //   if (!mounted) return;

  //   if (modalContent) {
  //     modalRef.current?.openModal();
  //   } else {
  //     modalRef.current?.closeModal();
  //   }

  //   const excludedRoutes = [
  //     window.location.origin,
  //     "/auth/login",
  //     "/auth/signup",
  //     "/web/home",
  //   ];
  //   const isExcludedRoute = excludedRoutes.includes(pathname);

  //   console.log(loginStatus);

  //   // Verify User Auth
  //   verifyAuth(useAppContext, useSharedHooks, router);
  //   if (loginStatus === "AUTHENTICATED") setModalContent(null);
  //   if (loginStatus === "LOCKED" && !isExcludedRoute)
  //     setModalContent({
  //       content: <AuthStepper />,
  //       shouldClose: false,
  //     });
  //   if (loginStatus === "UNAUTHENTICATED" && !isExcludedRoute) {
  //     setCurrentPage("home");
  //     router.replace("/web/home");
  //   }

  //   // Event handlers
  //   const handleVisibilityChange = () => {
  //     if (document.visibilityState === "visible")
  //       verifyAuth(useAppContext, useSharedHooks, router);
  //   };
  //   const handleFocus = () => verifyAuth(useAppContext, useSharedHooks, router);
  //   const handleOnline = () => {
  //     setSBMessage({
  //       msg: { content: "You are now online", msgStatus: "SUCCESS" },
  //       override: true,
  //     });
  //     setInlineMsg(null);
  //   };
  //   const handleOffline = () => {
  //     setSBMessage({
  //       msg: {
  //         title: "No internet connection",
  //         content: "Check your network and refresh the page",
  //         msgStatus: "ERROR",
  //         behavior: "FIXED",
  //         hasClose: true,
  //         cta: { label: "Refresh", action: () => window.location.reload() },
  //       },
  //     });
  //   };

  //   window.addEventListener("online", handleOnline);
  //   window.addEventListener("offline", handleOffline);
  //   document.addEventListener("visibilitychange", handleVisibilityChange);
  //   window.addEventListener("focus", handleFocus);

  //   return () => {
  //     window.removeEventListener("online", handleOnline);
  //     window.removeEventListener("offline", handleOffline);
  //     document.removeEventListener("visibilitychange", handleVisibilityChange);
  //     window.removeEventListener("focus", handleFocus);
  //   };
  // }, [
  //   mounted,
  //   modalContent,
  //   loginStatus,
  //   pathname,
  //   router,
  //   currentPage,
  //   setSBMessage,
  //   setAuthUser,
  //   setLoginStatus,
  //   setInlineMsg,
  //   setPage,
  // ]);

  if (!mounted) return null;

  const excludedUIRoutes = ["/auth/login", "/auth/signup"];

  return (
    <Stack sx={{ position: "fixed", height: "100vh", width: "100%", gap: 0 }}>
      <BlurEffect />
      {!excludedUIRoutes.includes(pathname) && <Header />}
      {snackBarMsgs.messgages && <SnackBars snackBarMsg={snackBarMsgs} />}
      {children}
      {modalContent && (
        <Modal
          ref={modalRef}
          children={{
            contentElement: modalContent.content,
          }}
          shouldClose={modalContent.shouldClose}
          entryDir="CENTER"
        />
      )}
      <Footer />
    </Stack>
  );
};
