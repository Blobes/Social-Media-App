let lastWakeTime = 0;

export const pingServices = () => {
  const now = Date.now();

  // Only wake services if they haven't been 'poked' in the last 14 minutes
  if (now - lastWakeTime > 14 * 60 * 1000) {
    // RE-READ variables here to ensure they are populated
    const services = [process.env.ACCOUNT_URL].filter(Boolean); // Filter out any undefined values

    if (services.length === 0) {
      console.warn("Pinger: No service URLs found in environment variables.");
      return;
    }
    console.log("User detected! Waking up sub-services...");
    services.forEach((url) => {
      fetch(url as string).catch(() => {});
    });
    lastWakeTime = now;
  }
};
