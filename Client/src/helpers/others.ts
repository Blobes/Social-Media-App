"use client";

import { fetcher } from "./fetcher";

export const getInitialsWithColors = (
  value: string
): { initials: string; textColor: string; bgColor: string } => {
  const parts = value.trim().split(/\s+/);
  const initials =
    (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();

  // Hash function from initials → number
  const hashCode = (str: string): number =>
    str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const hash = hashCode(initials || value);

  // Generate "random" but consistent colors
  const randomColor = (seed: number): string =>
    `#${((seed * 16777619) >>> 0).toString(16).slice(-6).padStart(6, "0")}`;

  const bgColor = randomColor(hash);
  const textColor = randomColor(hash * 13); // offset multiplier for variety

  return { initials, textColor, bgColor };
};

export const setCookie = (name: string, value: string, minutes: number) => {
  const expires = new Date(Date.now() + minutes * 60000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/`;
};

export const getCookie = (name: string): string | null => {
  const match = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
  return match ? decodeURIComponent(match[2]) : null;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=; Max-Age=0; path=/`;
};

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

// POST LIKE HANDLING HELPERS
const pendingLikesKey = "pendingLikes";
const likeQueueKey = "likeQueue";

// --- Pending likes ---
export const setPendingLike = (postId: string, liked: boolean) => {
  const pending = JSON.parse(localStorage.getItem(pendingLikesKey) || "{}");
  pending[postId] = liked;
  localStorage.setItem(pendingLikesKey, JSON.stringify(pending));
};

export const getPendingLike = (postId: string): boolean | null => {
  const pending = JSON.parse(localStorage.getItem(pendingLikesKey) || "{}");
  return pending[postId] ?? null;
};

export const clearPendingLike = (postId: string) => {
  const pending = JSON.parse(localStorage.getItem(pendingLikesKey) || "{}");
  delete pending[postId];
  localStorage.setItem(pendingLikesKey, JSON.stringify(pending));
};

// --- Offline queue ---
export const enqueueLike = (postId: string) => {
  const queue = JSON.parse(localStorage.getItem(likeQueueKey) || "[]");
  queue.push({ postId, timestamp: Date.now() });
  localStorage.setItem(likeQueueKey, JSON.stringify(queue));
};

export const processQueue = async () => {
  const queue = JSON.parse(localStorage.getItem(likeQueueKey) || "[]");
  if (!queue.length) return;

  const remaining: any[] = [];
  for (const { postId } of queue) {
    try {
      await fetcher(`/posts/${postId}/like`, { method: "PUT" });
    } catch {
      remaining.push({ postId, timestamp: Date.now() });
    }
  }
  localStorage.setItem(likeQueueKey, JSON.stringify(remaining));
};

// Number Summarizer
export const summarizeNum = (digit: string | number): string => {
  const num = typeof digit === "string" ? Number(digit) : digit;

  if (isNaN(num)) return "0";

  const n = Math.abs(num);

  let divider: number;
  let level: string;

  if (n < 1_000) {
    return num.toString();
  } else if (n < 1_000_000) {
    divider = 1_000;
    level = "K";
  } else if (n < 1_000_000_000) {
    divider = 1_000_000;
    level = "M";
  } else {
    divider = 1_000_000_000;
    level = "B";
  }

  const a = num / divider;
  const whole = Math.trunc(a);
  const decimalPart = a - whole;

  // Format based on magnitude
  if (decimalPart === 0 || whole >= 100) {
    return `${whole}${level}`;
  } else {
    // Show 1 decimal place if meaningful
    const formatted = a.toFixed(1);
    // Remove trailing .0 if not needed
    return `${formatted.replace(/\.0$/, "")}${level}`;
  }
};
