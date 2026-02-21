"use client";

import { GlobalThemeProvider } from "@repo/theme";
import { ContextProvider } from "./GlobalContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

interface ProvidersProps {
    children: React.ReactNode;
    themeMode?: 'light' | 'dark'; // Passed from the Server Layout
}

export function SharedProviders({ children, themeMode }: ProvidersProps) {
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
            <GlobalThemeProvider initialMode={themeMode}>
                <ContextProvider>
                    {children}
                </ContextProvider>
            </GlobalThemeProvider>
        </QueryClientProvider>
    );
}