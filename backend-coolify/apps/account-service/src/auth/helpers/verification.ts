import { findUserSessions } from "@repo/shared";

const INACTIVE_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000; // 15 days

/**
 * Checks if the user needs re-verification based on device recognition and activity.
 */
export const requireVerification = async (
  userId: string,
  incomingDeviceId: string,
): Promise<boolean> => {
  if (!incomingDeviceId || incomingDeviceId === "unknown") return true;

  const threshold = Date.now() - INACTIVE_THRESHOLD_MS;

  const validSessions = await findUserSessions(userId, (session) => {
    const isCorrectDevice = session?.deviceId === incomingDeviceId;
    const isFresh =
      session?.lastActive && new Date(session.lastActive).getTime() > threshold;

    return isCorrectDevice && isFresh;
  });

  // If we found at least one session matching these criteria, they don't need verification.
  return validSessions.length === 0;
};
