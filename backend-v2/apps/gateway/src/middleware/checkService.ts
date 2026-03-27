/**
 * Checks if a service is awake.
 * Returns true if the service responds within 2 seconds.
 */
export const isServiceAwake = async (target: string): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

  try {
    const healthUrl = target.endsWith("/")
      ? `${target}health`
      : `${target}/health`;

    // We use a simple GET. Even if it returns a 500, if it responds, it's "awake".
    await fetch(healthUrl, { signal: controller.signal });

    clearTimeout(timeoutId);
    return true;
  } catch (err) {
    return false; // Timeout or Connection Refused = Service is asleep
  } finally {
    clearTimeout(timeoutId);
  }
};
