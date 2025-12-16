"use client";

import { useEffect } from "react";
import { useAppContext } from "./AppContext";
import { useRouter } from "next/navigation";

export default function Main() {
  const router = useRouter();
  const { loginStatus, lastPage } = useAppContext();

  useEffect(() => {
    router.replace(lastPage.path);
  }, []);
  return;
}
