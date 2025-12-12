"use client";

import { getCookie } from "@/helpers/others";
import { IUser } from "@/types";
import { fetchUserWithTokenCheck } from "@/helpers/fetcher";

export const verifyAuth = async (
  appContext: any,
  sharedHooks: any,
  modalRef: any,
  isExcludedRoute: boolean,
  router: any
) => {
  const { setSBMessage } = sharedHooks();
  const { setAuthUser, setLoginStatus, currentPage, setPage } = appContext();

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
  if (!isExcludedRoute) {
    router.replace(currentPage);
  }
};
