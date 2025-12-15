"use client";

import { deleteCookie, getCookie } from "@/helpers/others";
import { fetchUserWithTokenCheck } from "@/helpers/fetcher";
import { LoginStatus } from "@/types";

export const verifyAuth = async (
  appContext: any,
  useSharedHooks: any
): Promise<LoginStatus> => {
  const { setAuthUser, setLoginStatus } = appContext();
  const { setSBMessage, setCurrentPage } = useSharedHooks();

  console.log("called in Auth");

  try {
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
      return "AUTHENTICATED";
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
      return "LOCKED";
    }

    // 🚫 Fully logged out
    setAuthUser(null);
    setLoginStatus("UNAUTHENTICATED");
    setCurrentPage("home");
    return "UNAUTHENTICATED";
  } catch (err: any) {
    setAuthUser(null);
    setLoginStatus("UNAUTHENTICATED");
    setCurrentPage("home");
    setSBMessage({
      msg: { content: "Unable to verify session", msgStatus: "ERROR" },
    });
    return "UNAUTHENTICATED";
  }
};
