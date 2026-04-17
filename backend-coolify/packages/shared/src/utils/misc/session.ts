import { upstashClient } from "../../services/upstash";
import { CACHE_KEYS } from "../redis/cache";

interface SessionCleanupOptions {
  userId: string;
  currentSessionId?: string;
  keepCurrentIfPrimary?: boolean;
  primarySessionId?: string | null;
}

/**
 * Iterates through all active Redis sessions for a user and
 * performs a selective or global cleanup.
 * @returns boolean - Returns true if the current session was preserved.
 */
export const cleanUserSessions = async ({
  userId,
  currentSessionId,
  keepCurrentIfPrimary = false,
  primarySessionId,
}: SessionCleanupOptions): Promise<boolean> => {
  const sessionPattern = CACHE_KEYS.WILDCARD_USER_ALL(userId);
  let cursor = "0";
  let keptCurrentSession = false;

  try {
    do {
      const [nextCursor, keys] = await upstashClient.scan(cursor, {
        match: sessionPattern,
        count: 100,
      });

      if (keys.length > 0) {
        for (const key of keys) {
          const sessionId = key.split(":").pop();

          // Check if we should preserve the current session
          if (
            keepCurrentIfPrimary &&
            sessionId === currentSessionId &&
            currentSessionId === primarySessionId
          ) {
            keptCurrentSession = true;
            continue; // Skip deletion
          }

          // Otherwise, terminate the session
          await upstashClient.del(key);
        }
      }
      cursor = nextCursor;
    } while (cursor !== "0");

    return keptCurrentSession;
  } catch (error) {
    console.error("Session Cleanup Utility Error:", error);
    throw new Error("Failed to process session cleanup");
  }
};

export const removeSession = async (
  userId: string,
  targetSessionId: string,
) => {
  await upstashClient.del(CACHE_KEYS.USER_SESSION(userId, targetSessionId));
};
