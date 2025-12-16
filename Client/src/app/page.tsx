"use client";

import { useEffect } from "react";
import { useAppContext } from "./AppContext";
import { useRouter } from "next/navigation";
import { Home } from "./web/home/Home";

export default function HomePage() {
  const router = useRouter();
  const { lastPage } = useAppContext();

  useEffect(() => {
    router.replace(lastPage.path);
  }, []);
  return <Home />;
}
