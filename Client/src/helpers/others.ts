"use client";

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

// Delay function
export const delay = (ms: number = 1500) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// Extract page title from path
export const extractPageTitle = (path: string) => {
  return path.split("/").pop() || "";
};

interface LocalItem {
  key?: string;
  fallback?: any;
}
export const getFromLocalStorage = <T = unknown | any>({
  key = "saved_page",
  fallback,
}: LocalItem = {}): T | null => {
  const savedItem = localStorage.getItem(key);
  if (savedItem) {
    return JSON.parse(savedItem) as T;
  }
  return (fallback as T) ?? null;
};

// default page
export const defaultPage = {
  title: "home",
  path: "/web/home",
};
