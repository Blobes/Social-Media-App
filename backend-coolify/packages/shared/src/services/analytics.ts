interface IEventPayload {
  userId?: string;
  anonymousId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Tracks business telemetry events asynchronously to evaluate user behaviors and onboarding bottlenecks.
 */
export const trackEvent = async (
  eventName: string,
  payload: IEventPayload,
): Promise<void> => {
  const { userId, anonymousId, ipAddress, userAgent, metadata } = payload;

  // Fire-and-forget delivery to external telemetry engines or high-throughput timeseries databases
  Promise.resolve()
    .then(() => {
      // Integration point for tools like PostHog, Mixpanel, or custom clickstream collectors
      console.log(`[Telemetry Event] ${eventName}:`, {
        distinctId: userId || anonymousId || "anonymous",
        context: {
          ipAddress,
          userAgent,
          timestamp: new Date(),
          ...metadata,
        },
      });
    })
    .catch((err) => {
      console.error("Telemetry Processing Failed:", err);
    });
};
