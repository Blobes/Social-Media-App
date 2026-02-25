"use client";

import { GlobalThemeProvider } from "@repo/theme";
import { ContextProvider } from "./GlobalContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { PrefetchCrossZoneLinks, PrefetchCrossZoneLinksProvider } from '@vercel/microfrontends/next/client';


export function SharedProviders({ children }: {
    children: React.ReactNode;
}) {
    // We initialize the QueryClient inside a useState to ensure it's 
    // only created once per application lifecycle (singleton).
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
                retry: 1,
            },
        },
    }));
    return (
        <QueryClientProvider client={queryClient}>

            <GlobalThemeProvider>
                <ContextProvider>
                    <PrefetchCrossZoneLinksProvider>
                        {children}
                    </PrefetchCrossZoneLinksProvider>
                    <PrefetchCrossZoneLinks />
                </ContextProvider>
            </GlobalThemeProvider>

        </QueryClientProvider>
    );
}