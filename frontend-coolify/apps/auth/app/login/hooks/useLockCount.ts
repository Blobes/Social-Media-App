"use client";

import { clearLoginLock, getLockRemaining } from "@repo/features";
import { useState, useEffect, useRef, useCallback } from "react";

interface CountdownResult {
  remainingSec: number;
  isLocked: boolean;
  clearLock: () => void;
}

export const useLockCountdown = (
  lockTimestamp: string | number | null,
  lockoutMin: number,
  onComplete?: () => void,
): CountdownResult => {
  const [remainingSec, setRemainingSec] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearLock = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRemainingSec(0);
    clearLoginLock();
  }, []);

  useEffect(() => {
    if (!lockTimestamp) return;

    const lockTime = Number(lockTimestamp);

    const tick = () => {
      const remaining = getLockRemaining(lockTime, lockoutMin);
      if (remaining <= 0) {
        clearLock();
        if (onComplete) onComplete(); // Notify the controller
      } else {
        setRemainingSec(remaining);
      }
    };

    tick(); // Run immediately
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lockTimestamp, lockoutMin, clearLock, onComplete]);

  return {
    remainingSec,
    isLocked: remainingSec > 0,
    clearLock,
  };
};
