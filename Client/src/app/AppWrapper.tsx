"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Stack } from "@mui/material";
import { BlurEffect } from "../components/BlurEffect";
import { Header } from "@/components/app-navbar/Header";
import { SnackBars } from "@/components/SnackBars";
import { useAppContext } from "./AppContext";
import { Footer } from "@/components/Footer";
import { Modal, ModalRef } from "@/components/Modal";
import { useRouter } from "next/navigation";
import { getCookie } from "@/helpers/others";
import { IUser } from "@/types";
import { fetchUserWithTokenCheck } from "@/helpers/fetcher";
import { useSharedHooks } from "@/hooks";
import { AuthStepper } from "./auth/login/AuthStepper";

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const excludedRoutes = [
    window.location.origin,
    "/auth/login",
    "/auth/signup",
    "/web/home",
  ];
  const isExcludedRoute = excludedRoutes.includes(pathname);
  const modalRef = useRef<ModalRef>(null);
  const router = useRouter();
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

  useEffect(() => {
    const verifyAuth = async () => {
      const user = await fetchUserWithTokenCheck();
      const msg = user.message?.toLowerCase() ?? "";

      if (navigator.onLine && user.payload) {
        setAuthUser(user.payload);
        setLoginStatus("AUTHENTICATED");
        return;
      }

      const storedUser = getCookie("user");
      if (storedUser && storedUser !== "null") {
        const parsed = JSON.parse(storedUser) as IUser;
        setAuthUser(parsed);
        if (!msg.includes("no token provided")) {
          setSBMessage({
            msg: { content: user.message, msgStatus: "ERROR", hasClose: true },
          });
        } else {
          setLoginStatus("UNAUTHENTICATED");
          setTimeout(() => modalRef.current?.openModal(), 50);
        }
        return;
      }
      setLoginStatus("UNAUTHENTICATED");
      setPage("/web/home");
      !isExcludedRoute && router.replace(currentPage);
    };

    // Verify auth once when component mounts
    verifyAuth();
    // Verify auth again when tab becomes visible (user revisits tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        verifyAuth();
      }
    };
    // Verify auth again when window regains focus
    const handleFocus = () => verifyAuth();
    // Handle online and offline status
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
          cta: {
            label: "Refresh",
            action: () => {
              window.location.reload();
            },
          },
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
  }, [loginStatus, pathname]);

  return (
    <Stack sx={{ position: "fixed", height: "100vh", width: "100%", gap: 0 }}>
      <BlurEffect />
      {!["/auth/login", "/auth/signup"].includes(pathname) && <Header />}
      {snackBarMsgs.messgages && <SnackBars snackBarMsg={snackBarMsgs} />}
      {children}
      {!isExcludedRoute && (
        <>
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
        </>
      )}
      <Footer />
    </Stack>
  );
};
