// Define your sub-service public URLs
const SUB_SERVICES = [
  "https://funstakes-auth.onrender.com",
  "https://funstakes-post.onrender.com",
  "https://funstakes-user.onrender.com",
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
      fetch(url).catch(() => {});
    });
    lastWakeTime = now;
  }
};
