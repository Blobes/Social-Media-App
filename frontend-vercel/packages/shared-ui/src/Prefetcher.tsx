"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function Prefetcher({ route }: { route: string }) {
    const router = useRouter();

    useEffect(() => {
        // This tells Next.js to fetch the JS and data for the /offline route
        // without actually navigating to it.
        router.prefetch(route);

        // Optional: Also fetch it via the native browser fetch to ensure 
        // the Service Worker sees the request clearly
        fetch(route).catch(() => { });
    }, [router]);

    return null;
}