"use client";

/**
 * Sets a cookie with legacy minute support and an optional configuration object.
 */
export const setCookie = (
  name: string,
  value: string,
  minutes: number,
  options: {
    domain?: string;
    secure?: boolean;
    path?: string;
    sameSite?: "lax" | "strict" | "none";
  } = {},
) => {
  const expires = new Date(Date.now() + minutes * 60000).toUTCString();

  // Use the provided path or default to /
  const cookiePath = options.path || "/";
  let cookieString = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${cookiePath}`;

  if (options.domain) cookieString += `; domain=${options.domain}`;
  if (options.secure) cookieString += `; secure`;
  if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;

  document.cookie = cookieString;
};

export const getCookie = (name: string): string | null => {
  const match = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
  return match ? decodeURIComponent(match[2]) : null;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=; Max-Age=0; path=/`;
};

export const saveToLocalStorage = <T>(key: string, value: T): void => {
  try {
    // This ensures strings are stored as ""STRING"" and objects as "{...}"
    const valueToStore = JSON.stringify(value);
    localStorage.setItem(key, valueToStore);
  } catch (error) {
    console.error("Storage Error:", error);
  }
};

interface LocalItem {
  key?: string;
  fallback?: any;
}
export const getFromLocalStorage = <T = unknown | any>({
  key = "saved_page",
  fallback,
}: LocalItem = {}): T | null => {
  if (typeof window === "undefined") return (fallback as T) ?? null;

  const savedItem = localStorage.getItem(key);
  if (savedItem) {
    try {
      // Try to parse as JSON (handles objects, arrays, and quoted strings)
      return JSON.parse(savedItem) as T;
    } catch (e) {
      // If parsing fails, the item was likely stored as a raw string
      // Return the raw string as T
      return savedItem as unknown as T;
    }
  }
  return (fallback as T) ?? null;
};

export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error deleting from localStorage (key: "${key}"):`, error);
  }
};

export const clearLocalStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
};
