"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function Prefetcher({ route }: { route: string }) {
  const router = useRouter();

  useEffect(() => {
    // Next.js handles the caching and service worker integration for you
    router.prefetch(route);
  }, [router, route]);

  return null;
}
