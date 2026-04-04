import { useState, useEffect, useRef, useCallback } from "react";
import { getLockRemaining, clearLoginLock } from "@repo/helpers";

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

    if (onComplete) onComplete(); // Notify the controller
  }, [onComplete]);

  useEffect(() => {
    if (!lockTimestamp) return;

    const lockTime = Number(lockTimestamp);

    const tick = () => {
      const remaining = getLockRemaining(lockTime, lockoutMin);
      if (remaining <= 0) {
        clearLock();
      } else {
        setRemainingSec(remaining);
      }
    };

    tick(); // Run immediately
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lockTimestamp, lockoutMin, clearLock]);

  return {
    remainingSec,
    isLocked: remainingSec > 0,
    clearLock,
  };
};
