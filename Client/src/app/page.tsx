"use client";

import { useEffect } from "react";
import { useAppContext } from "./AppContext";
import { useRouter } from "next/navigation";

export default function Main() {
  const router = useRouter();
  const { loginStatus } = useAppContext();

  useEffect(() => {
    router.replace(loginStatus === "AUTHENTICATED" ? "timeline" : "web/home");
  }, [loginStatus]);
  return;
}
