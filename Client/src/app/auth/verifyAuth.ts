"use client";

import { deleteCookie, getCookie } from "@/helpers/others";
//import { IUser, UserSnapshot } from "@/types";
import { fetchUserWithTokenCheck } from "@/helpers/fetcher";

export const verifyAuth = async (
  appContext: any,
  useSharedHooks: any,
  router: any
) => {
  const { setAuthUser, setLoginStatus, setPage } = appContext();
  const { setSBMessage } = useSharedHooks();

  const res = await fetchUserWithTokenCheck();
  const snapshot: any = getCookie("user_snapshot");

  // ✅ Fully authenticated
  if (navigator.onLine && res.payload) {
    setAuthUser(res.payload);
    setLoginStatus("AUTHENTICATED");
    if (snapshot) router.replace(snapshot.lastRoute);
    deleteCookie("user_snapshot");
    return;
  }

  // 🔒 Token invalid but snapshot exists → LOCKED
  if (snapshot) {
    setAuthUser(JSON.parse(snapshot));
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
  setPage("/web/home");
};
