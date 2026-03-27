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
    // Do NOT wait 5 seconds; we want the boot process to start the millisecond the user hits the gateway.
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

// export const pingServices = () => {
//   const now = Date.now();
//   const WAKE_INTERVAL = 14 * 60 * 1000; // 14 minutes

//   if (now - lastWakeTime > WAKE_INTERVAL) {
//     // Only target the specific service that needs waking
//     const services = [process.env.ACCOUNT_URL]
//       .filter(Boolean)
//       .map((url) => (url?.endsWith("/") ? `${url}health` : `${url}/health`));

//     if (services.length === 0) return;

//     console.log("[Pinger] Background wake-up initiated for Account Service...");

//     // We use a separate async execution to prevent socket contention
//     setTimeout(() => {
//       services.forEach((url) => {
//         fetch(url as string, {
//           method: "GET",
//           headers: {
//             "User-Agent": "Funstakes-Gateway-Pinger",
//           },
//         })
//           .then(() => console.log(`[Pinger] Successfully poked ${url}`))
//           .catch((err) =>
//             console.error(`[Pinger] Poke failed for ${url}:`, err.message),
//           );
//       });
//     }, 5000); // Wait 5 seconds

//     lastWakeTime = now;
//   }
// };

export const isNotPingableRoute = (path: string) => {
  const prefixes = ["/account", "/auth", "/user"];
  return prefixes.some((prefix) => path.startsWith(prefix));
};
