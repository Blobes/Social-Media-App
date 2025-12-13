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

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();

  // Always initialize hooks here — top of the component
  const modalRef = useRef<ModalRef>(null);
  const { setSBMessage } = useSharedHooks();
  const {
    snackBarMsgs,
    setAuthUser,
    loginStatus,
    setLoginStatus,
    setInlineMsg,
    currentPage,
    setPage,
  } = useAppContext();

  // Client-only UI rendering
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // All client-only or window-dependent logic goes inside useEffect
  useEffect(() => {
    if (!mounted) return;

    const excludedRoutes = [
      window.location.origin,
      "/auth/login",
      "/auth/signup",
      "/web/home",
    ];
    const isExcludedRoute = excludedRoutes.includes(pathname);

    // Verify User Auth
    verifyAuth(useAppContext, useSharedHooks);
    if (loginStatus === "LOCKED") modalRef.current?.openModal();
    if (!isExcludedRoute && loginStatus === "UNAUTHENTICATED")
      router.replace("/web/home");
    if (loginStatus === "AUTHENTICATED") modalRef.current?.closeModal();

    // Event handlers
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible")
        verifyAuth(useAppContext, useSharedHooks);
    };
    const handleFocus = () => verifyAuth(useAppContext, useSharedHooks);
    const handleOnline = () => {
      setSBMessage({
        msg: { content: "You are now online", msgStatus: "SUCCESS" },
        override: true,
      });
      setInlineMsg(null);
    };
    const handleOffline = () => {
      setSBMessage({
        msg: {
          title: "No internet connection",
          content: "Check your network and refresh the page",
          msgStatus: "ERROR",
          behavior: "FIXED",
          hasClose: true,
          cta: { label: "Refresh", action: () => window.location.reload() },
        },
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [
    mounted,
    loginStatus,
    pathname,
    router,
    currentPage,
    setSBMessage,
    setAuthUser,
    setLoginStatus,
    setInlineMsg,
    setPage,
  ]);

  if (!mounted) return null;

  const excludedUIRoutes = ["/auth/login", "/auth/signup"];

  return (
    <Stack sx={{ position: "fixed", height: "100vh", width: "100%", gap: 0 }}>
      <BlurEffect />
      {!excludedUIRoutes.includes(pathname) && <Header />}
      {snackBarMsgs.messgages && <SnackBars snackBarMsg={snackBarMsgs} />}
      {children}
      {!excludedUIRoutes.includes(pathname) && (
        <Modal
          ref={modalRef}
          children={{
            contentElement: (
              <AuthStepper modalRef={modalRef} redirectTo={currentPage} />
            ),
          }}
          shouldClose={false}
          entryDir="CENTER"
        />
      )}
      <Footer />
    </Stack>
  );
};
