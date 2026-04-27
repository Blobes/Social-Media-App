"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function Prefetcher({ route }: { route: string }) {
  const router = useRouter();

  useEffect(() => {
    // Only prefetch if we are actually online
    if (typeof window !== "undefined" && window.navigator.onLine) {
      router.prefetch(route);
    }
  }, [router, route]);

  return null;
}
