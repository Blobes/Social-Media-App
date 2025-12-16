"use client";

import { extractPageTitle, getCookie } from "@/helpers/others";
import { fetchUserWithTokenCheck } from "@/helpers/fetcher";
import { SavedPage } from "@/types";
import { defaultPage } from "@/helpers/info";

interface VerifyParams {
  setAuthUser: Function;
  setLoginStatus: Function;
  setSBMessage: Function;
  setLastPage: (page: SavedPage) => void;
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
    const pagePath = !isExcludedRoute ? pathname : "/timeline";

    // Fully authenticated
    if (navigator.onLine && res.payload) {
      setAuthUser(res.payload);
      setLoginStatus("AUTHENTICATED");
      setLastPage({ title: extractPageTitle(pagePath), path: pagePath });
      return;
    }

    // Token invalid but snapshot exists → LOCKED
    if (userSnapshot) {
      setAuthUser(userSnapshot);
      setLoginStatus("LOCKED");
      setLastPage({ title: extractPageTitle(pagePath), path: pagePath });
      if (!res.message?.toLowerCase().includes("no token")) {
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
