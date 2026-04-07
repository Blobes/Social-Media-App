export const prefetchPage = (href?: string, isCrossZone?: boolean) => {
  if (isCrossZone && href && typeof window !== "undefined") {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    document.head.appendChild(link);
  }
};
