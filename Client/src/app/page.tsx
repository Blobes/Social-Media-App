"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home } from "./web/home/Home";
import { getFromLocalStorage } from "@/helpers/others";
import { useSharedHooks } from "@/hooks";
import { defaultPage } from "@/helpers/info";
import { SavedPage } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const { setLastPage } = useSharedHooks();

  useEffect(() => {
    const savedPage = getFromLocalStorage<SavedPage>() ?? defaultPage;
    setLastPage(savedPage);
    router.prefetch(savedPage.path);
  }, []);
  return <Home />;
}
