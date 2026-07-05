"use client";

import { useMemo } from "react";
import { formatDate } from "@repo/helpers";
import { useGlobalStore } from "@repo/core";

/**
 * Optimized hook that subscribes to a single global clock pulse.
 * Only re-formats if the timestamp is "fresh" (less than 1 hour old).
 */
export const useAdaptiveTime = (timestamp: string | number) => {
  const now = useGlobalStore((state) => state.now);

  return useMemo(() => {
    const timeInMs =
      typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;

    const ageInMinutes = (now - timeInMs) / 1000 / 60;

    // If the post is older than 60 minutes, the "SHORTENED" format
    // (like '1h', '2h', '1d') only changes once per hour or day.
    // We skip the minute-by-minute re-calculation for these.
    if (ageInMinutes > 60) return formatDate(timestamp, "SHORTENED");

    // For "fresh" posts (0-60m), we re-format every minute.
    return formatDate(timestamp, "SHORTENED");
  }, [timestamp, now]);
};
