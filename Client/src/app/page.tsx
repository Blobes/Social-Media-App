"use client";

import { useEffect } from "react";
import { useAppContext } from "./AppContext";
import { usePathname, useRouter } from "next/navigation";
import { Home } from "./web/home/Home";
import { getFromLocalStorage } from "@/helpers/others";
import { useSharedHooks } from "@/hooks";

export default function HomePage() {
  const router = useRouter();
  const { setLastPage } = useSharedHooks();

  useEffect(() => {
    const savedPage = getFromLocalStorage();
    if (savedPage) {
      setLastPage(savedPage);
      router.replace(savedPage.path);
    }
  }, []);
  return <Home />;
}
