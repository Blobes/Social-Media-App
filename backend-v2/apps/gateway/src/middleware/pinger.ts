let lastWakeTime = 0;

/**
 * Background Service Pinger:
 * Wakes up sub-services without blocking the main Express request cycle.
 */
export const pingServices = () => {
  const now = Date.now();
  const WAKE_INTERVAL = 14 * 60 * 1000; // 14 minutes

  if (now - lastWakeTime > WAKE_INTERVAL) {
    // Only target the specific service that needs waking
    const services = [process.env.ACCOUNT_URL]
      .filter(Boolean)
      .map((url) => (url?.endsWith("/") ? `${url}health` : `${url}/health`));

    if (services.length === 0) return;

    console.log("[Pinger] Background wake-up initiated for Account Service...");

    // We use a separate async execution to prevent socket contention
    services.forEach((url) => {
      fetch(url as string, {
        method: "GET",
        headers: {
          "User-Agent": "Funstakes-Gateway-Pinger",
        },
      })
        .then(() => console.log(`[Pinger] Successfully poked ${url}`))
        .catch((err) =>
          console.error(`[Pinger] Poke failed for ${url}:`, err.message),
        );
    });

    lastWakeTime = now;
  }
};
