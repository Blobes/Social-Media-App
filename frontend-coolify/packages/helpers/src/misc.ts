"use client";

// Delay function
export const delay = (ms: number = 1500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Extract page title from path
export const extractPageTitle = (path: string) => {
  return path === "/" ? "Home" : path.replace(/\/$/, "").split("/").pop() || "";
};

export const matchPaths = (pathA: string, pageB: string) => {
  return (
    pathA.toLowerCase() === pageB.toLowerCase() ||
    pathA.toLowerCase().startsWith(`/${pageB.toLowerCase()}`)
  );
};

const getPathZone = (p: string) => {
  const segment = p.split("/").filter(Boolean)[0];
  return segment ? `/${segment.toLowerCase()}` : "/";
};

/**
 * Determines if a navigation target requires a hard reload (Cross-Zone)
 * or if it can be handled by the current app's SPA router.
 */
export const crossZoneCheck = (path: string): boolean => {
  const targetPath = path.toLowerCase();
  const currentPath = window.location.pathname.toLowerCase();

  if (targetPath === "/" || targetPath === currentPath) return false;

  const targetZone = getPathZone(targetPath);
  const currentZone = getPathZone(currentPath);

  // Check if target starts with the current zone's prefix
  return !matchPaths(targetZone, currentZone);
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
