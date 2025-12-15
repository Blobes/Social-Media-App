"use client";

import { defaultPage, extractPageTitle, getCookie } from "@/helpers/others";
import { fetchUserWithTokenCheck } from "@/helpers/fetcher";

interface VerifyParams {
  setAuthUser: Function;
  setLoginStatus: Function;
  setSBMessage: Function;
  setLastPage: Function;
  pathname: string;
  isExcludedRoute: boolean;
}

export const verifyAuth = async ({
  setAuthUser,
  setLoginStatus,
  setSBMessage,
  setLastPage,
  pathname,
  isExcludedRoute,
}: VerifyParams) => {
  try {
    const res = await fetchUserWithTokenCheck();
    const snapshotCookie = getCookie("user_snapshot");
    const userSnapshot = snapshotCookie ? JSON.parse(snapshotCookie) : null;

    // ✅ Fully authenticated
    if (navigator.onLine && res.payload) {
      setAuthUser(res.payload);
      setLoginStatus("AUTHENTICATED");
      const pagePath = !isExcludedRoute ? pathname : "/timeline";
      setLastPage({ title: extractPageTitle(pagePath), path: pagePath });
      return;
    }

    // 🔒 Token invalid but snapshot exists → LOCKED
    if (userSnapshot) {
      setAuthUser(userSnapshot);
      setLoginStatus("LOCKED");
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
    setLastPage({ title: defaultPage.title, path: defaultPage.path });
    return;
  } catch (err: any) {
    setAuthUser(null);
    setLoginStatus("UNAUTHENTICATED");
    setLastPage({ title: defaultPage.title, path: defaultPage.path });
    setSBMessage({
      msg: { content: "Unable to verify session", msgStatus: "ERROR" },
    });
    return;
  }
};
