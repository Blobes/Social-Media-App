"use client";

import { DateType } from "@repo/core";
import { clearCookies } from "./storage";

export const formatDate = (
  dateValue: string | number | Date,
  type: DateType = "SHORTENED",
): string => {
  // 1. Create date object safely
  // If dateValue is a string like "22/08/2025", we need to flip it to "2025-08-22" for Safari
  let date: Date;
  if (typeof dateValue === "string" && dateValue.includes("/")) {
    const [d, m, y] = dateValue.split(",")[0].split("/");
    const time = dateValue.split(",")[1] || "";
    date = new Date(`${y}-${m}-${d}${time ? "T" + time.trim() : ""}`);
  } else {
    date = new Date(dateValue);
  }

  // Check for Invalid Date
  if (isNaN(date.getTime())) return "Invalid Date";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // RETURN COMPLETE VERSION / DATE-ONLY
  if (type === "COMPLETE" || type === "DATE-ONLY") {
    const dayNum = date.getDate();
    const monthStr = date.toLocaleString("en-US", { month: "short" });
    const yearShort = date.getFullYear().toString().slice(-2);

    if (type === "DATE-ONLY") return `${dayNum} ${monthStr} ${yearShort}`;

    // Formatting time: 12:10 PM
    const timeStr = date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${dayNum} ${monthStr} ${yearShort} – ${timeStr}`;
  }

  // RETURN SHORTENED VERSION
  if (diffInSeconds < 60) return "Now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)}mo`;

  return `${Math.floor(diffInSeconds / 31536000)}y`;
};

export const getLockRemaining = (
  lockTimestamp: string | number | null,
  maxMinutes: number,
) => {
  if (!lockTimestamp) return 0;
  const timestamp =
    typeof lockTimestamp === "string" ? Number(lockTimestamp) : lockTimestamp;
  const elapsed = Date.now() - timestamp;
  const remaining = maxMinutes * 60 * 1000 - elapsed;
  return Math.max(0, Math.ceil(remaining / 1000)); // in seconds
};

/**
 * Resets authentication lockout timestamps and attempt records.
 */
export const clearLoginLock = (): void => {
  clearCookies(["loginLockTime", "loginAttempts"]);
};

export const formatRemainingTime = (seconds: number) => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}m ${sec}s`;
};
