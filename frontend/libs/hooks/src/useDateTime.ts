"use client";

import { useState, useEffect, useMemo } from "react";
import { formatDate } from "@funstakes/helpers";

export const useAdaptiveTime = (timestamp: string | number) => {
  // 1. Initial Calculation to see where we stand
  const [display, setDisplay] = useState(() =>
    formatDate(timestamp, "shortened"),
  );

  // 2. Determine if we need an interval
  // We check if the current 'shortened' string suggests it's older than an hour.
  // Since the formatter uses "m" for minutes, if it contains "m" or is "Now", we tick.
  const isFresh = useMemo(() => {
    const isMinute = display.endsWith("m");
    const isNow = display === "Now";
    return isNow || isMinute;
  }, [display]);

  useEffect(() => {
    // If it's older than an hour, don't start the interval at all
    if (!isFresh) return;

    const timer = setInterval(() => {
      const nextValue = formatDate(timestamp, "shortened");
      setDisplay(nextValue);

      // Optimization: If the new value no longer ends in 'm' (it's now '1h'),
      // the next effect run will clean this up via the dependency array.
    }, 60000);

    return () => clearInterval(timer);
  }, [timestamp, isFresh]); // Re-evaluate if timestamp or "freshness" changes

  return display;
};
