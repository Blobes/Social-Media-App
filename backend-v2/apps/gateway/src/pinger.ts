// Define your sub-service public URLs
const SUB_SERVICES = [
  process.env.AUTH_URL,
  process.env.POST_URL,
  process.env.USER_URL,
];

let lastWakeTime = 0;

export const pingServices = () => {
  console.log(
    "User detected! Triggering background wake-up for all sub-services...",
  );
  const now = Date.now();
  // Only wake services if they haven't been 'poked' in the last 14 minutes
  if (now - lastWakeTime > 14 * 60 * 1000) {
    SUB_SERVICES.forEach((url) => {
      fetch(url as any).catch(() => {});
    });
    lastWakeTime = now;
  }
};
