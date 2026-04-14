"use client";

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

  if (targetPath === "/") return currentPath !== "/";

  if (targetPath === currentPath) return false;

  const targetZone = getPathZone(targetPath);
  const currentZone = getPathZone(currentPath);

  // Check if target starts with the current zone's prefix
  return !matchPaths(targetZone, currentZone);
};

export const prefetchPage = (href?: string, isCrossZone?: boolean) => {
  if (isCrossZone && href && typeof window !== "undefined") {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    document.head.appendChild(link);
  }
};
