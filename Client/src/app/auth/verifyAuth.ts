"use client";

import { deleteCookie, getCookie } from "@/helpers/others";
import { fetchUserWithTokenCheck } from "@/helpers/fetcher";

export const verifyAuth = async (
  appContext: any,
  useSharedHooks: any,
  router: any
) => {
  const { setAuthUser, setLoginStatus } = appContext();
  const { setSBMessage, setCurrentPage } = useSharedHooks();

  const res = await fetchUserWithTokenCheck();
  const userSnapshot: any = getCookie("user_snapshot");

  // ✅ Fully authenticated
  if (navigator.onLine && res.payload) {
    setAuthUser(res.payload);
    setLoginStatus("AUTHENTICATED");
    if (userSnapshot) {
      setCurrentPage(userSnapshot.lastRoute || "timeline");
      router.replace(userSnapshot.lastRoute || "/timeline");
    }
    deleteCookie("user_snapshot");
    return;
  }

  // 🔒 Token invalid but snapshot exists → LOCKED
  if (userSnapshot) {
    setAuthUser(JSON.parse(userSnapshot));
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
};
