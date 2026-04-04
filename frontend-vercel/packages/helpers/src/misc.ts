"use client";

// Delay function
export const delay = (ms: number = 1500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Extract page title from path
export const extractPageTitle = (path: string) => {
  return path === "/"
    ? "Home"
    : path === "/web"
      ? "About"
      : path.replace(/\/$/, "").split("/").pop() || "";
};

export const matchPaths = (pathname: string, pagePath: string | undefined) => {
  return (
    pathname === pagePath?.toLowerCase() ||
    pathname.toLowerCase().startsWith(`/${pagePath}`)
  );
};

export const zIndexes = {
  negative: -1,
  minimum: 0,
  5: 5,
  10: 10,
  15: 15,
  20: 20,
  25: 25,
  30: 30,
  35: 35,
  40: 40,
  45: 45,
  50: 50,
  55: 55,
  60: 60,
  500: 500,
  maximum: 1000,
};

export const vibrate = (ms: number = 100) => {
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  if (isTouchDevice && "vibrate" in navigator) {
    navigator.vibrate(ms);
  }
};
