"use client";

import { deleteCookie, getCookie } from "@/helpers/others";
import { fetchUserWithTokenCheck } from "@/helpers/fetcher";

export const verifyAuth = async (appContext: any, useSharedHooks: any) => {
  const { setAuthUser, setLoginStatus } = appContext();
  const { setSBMessage, setCurrentPage } = useSharedHooks();

  const waitForCookies = async (maxRetries = 5, delayMs = 100) => {
    for (let i = 0; i < maxRetries; i++) {
      const cookie = getCookie("access_token");
      if (cookie) return true;
      await new Promise((res) => setTimeout(res, delayMs));
    }
    return false;
  };

  try {
    const hasCookie = await waitForCookies();
    if (!hasCookie) throw new Error("No token cookie yet");

    const res = await fetchUserWithTokenCheck();
    const snapshotCookie = getCookie("user_snapshot");
    const userSnapshot = snapshotCookie ? JSON.parse(snapshotCookie) : null;

    // ✅ Fully authenticated
    if (navigator.onLine && res.payload) {
      setAuthUser(res.payload);
      setLoginStatus("AUTHENTICATED");

      // Resume last route if snapshot exists
      const lastRoute = userSnapshot?.lastRoute || "/timeline";
      setCurrentPage(lastRoute.replace("/", ""));
      deleteCookie("user_snapshot");
      return;
    }

    // 🔒 Token invalid but snapshot exists → LOCKED
    if (userSnapshot) {
      setAuthUser(userSnapshot);
      setLoginStatus("LOCKED");
      setCurrentPage(userSnapshot.lastRoute?.replace("/", "") || "timeline");
      if (!res.message?.includes("no token provided")) {
        setSBMessage({
          msg: { content: res.message, msgStatus: "ERROR", hasClose: true },
        });
      }
      return;
    }

    // 🚫 Fully logged out
    setAuthUser(null);
    setLoginStatus("UNAUTHENTICATED");
    setCurrentPage("home");
  } catch (err: any) {
    setAuthUser(null);
    setLoginStatus("UNAUTHENTICATED");
    setCurrentPage("home");
    setSBMessage({
      msg: { content: "Unable to verify session", msgStatus: "ERROR" },
    });
  }
};
