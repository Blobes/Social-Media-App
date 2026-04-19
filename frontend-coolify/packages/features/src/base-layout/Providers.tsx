"use client";

import React from "react";
import { GlobalThemeProvider } from "@repo/core";
import { QueryClientProvider } from "@tanstack/react-query";
// Import the specific instance that has persistQueryClient attached to it
import { queryClient } from "@repo/helpers";

/**
 * Wraps the application with necessary providers.
 * Uses the persisted queryClient instance to enable IndexedDB caching.
 */
export function SharedProviders({ children }: { children: React.ReactNode }) {
  /**
   * We pass the pre-configured queryClient from our helpers.
   * This ensures the persister and the UI share the same data bucket.
   */
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalThemeProvider>{children}</GlobalThemeProvider>
    </QueryClientProvider>
  );
}
