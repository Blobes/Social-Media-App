"use client";

import { deleteCookie } from "./others";

export const getLockRemaining = (
  lockTimestamp: string | number | null,
  maxMinutes: number
) => {
  if (!lockTimestamp) return 0;
  const timestamp =
    typeof lockTimestamp === "string" ? Number(lockTimestamp) : lockTimestamp;
  const elapsed = Date.now() - timestamp;
  const remaining = maxMinutes * 60 * 1000 - elapsed;
  return Math.max(0, Math.ceil(remaining / 1000)); // in seconds
};

export const clearLoginLock = () => {
  deleteCookie("loginLockTime");
  deleteCookie("loginAttempts");
};

export const formatRemainingTime = (seconds: number) => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}m ${sec}s`;
};
