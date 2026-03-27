/**
 * Background Service Pinger:
 * Wakes up sub-services without blocking the main Express request cycle.
 */
let lastWakeTime = 0;
export const pingServices = () => {
  const now = Date.now();
  const WAKE_INTERVAL = 14 * 60 * 1000; // 14 minutes

  if (now - lastWakeTime > WAKE_INTERVAL) {
    // Add ALL your services here
    const services = [
      process.env.ACCOUNT_URL,
      process.env.POST_URL,
      process.env.ADMIN_URL,
      process.env.WORKER_URL,
    ]
      .filter(Boolean)
      .map((url) => (url?.endsWith("/") ? `${url}health` : `${url}/health`));

    if (services.length === 0) return;

    console.log("[Pinger] Background wake-up initiated for all services...");

    // Fire-and-forget immediately.
    services.forEach((url) => {
      fetch(url as string, { method: "GET" })
        .then(() => console.log(`[Pinger] Poke successful: ${url}`))
        .catch(() => {}); // Ignore errors; it's just a wake-up call
    });

    lastWakeTime = now;
  }
};

export const isSystemRoute = (path: string) => {
  return ["/keep-alive", "/health"].includes(path);
};

// export const isNotPingableRoute = (path: string) => {
//   const prefixes = ["/account", "/auth", "/user"];
//   return prefixes.some((prefix) => path.startsWith(prefix));
// };
