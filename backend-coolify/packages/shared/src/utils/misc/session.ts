import { upstashClient } from "../../services/upstash";
import { CACHE_KEYS } from "../redis/cache";

interface SessionCleanupOptions {
  userId: string;
  currentSessionId?: string;
  keepCurrentIfPrimary?: boolean;
  primarySessionId?: string | null;
}

/**
 * Terminates sessions for a user based on specific preservation rules.
 * Uses a single batch deletion to minimize network round-trips.
 */
export const cleanUserSessions = async ({
  userId,
  currentSessionId,
  keepCurrentIfPrimary = false,
  primarySessionId,
}: SessionCleanupOptions): Promise<boolean> => {
  try {
    let keptCurrentSession = false;

    // 1. Fetch all sessions using the reusable utility
    const allSessions = await findUserSessions(userId);

    // 2. Identify keys that need to be deleted
    const keysToDelete: string[] = [];

    for (const session of allSessions) {
      const { key, sessionId } = session;

      // Check if we should preserve the current session
      const isCurrentPrimary =
        keepCurrentIfPrimary &&
        sessionId === currentSessionId &&
        currentSessionId === primarySessionId;

      if (isCurrentPrimary) {
        keptCurrentSession = true;
        continue; // Skip adding to delete list
      }

      keysToDelete.push(key);
    }

    // 3. Perform batch deletion
    if (keysToDelete.length > 0) {
      await upstashClient.del(...keysToDelete);
    }

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

/**
 * Scans Redis for all sessions belonging to a user and returns their data.
 */
export const findUserSessions = async (
  userId: string,
  filter?: (session: any) => boolean,
): Promise<{ key: string; sessionId: string; data: any }[]> => {
  const pattern = CACHE_KEYS.WILDCARD_USER_SESSIONS(userId);
  let cursor = "0";
  const matches: { key: string; sessionId: string; data: any }[] = [];

  do {
    const [nextCursor, keys] = await upstashClient.scan(cursor, {
      match: pattern,
      count: 100,
    });

    if (keys.length > 0) {
      const pipeline = upstashClient.pipeline();
      keys.forEach((key) => pipeline.get(key));
      const results = await pipeline.exec();

      results.forEach((session: any, index: number) => {
        if (session) {
          const include = filter ? filter(session) : true;
          if (include) {
            matches.push({
              key: keys[index],
              sessionId: keys[index].split(":").pop() || "",
              data: session,
            });
          }
        }
      });
    }
    cursor = nextCursor;
  } while (cursor !== "0");

  return matches;
};

/**
 * Checks if the user's primary session has expired.
 * If the primary is gone, all other sessions are terminated.
 */
export const enforcePrimarySessionPolicy = async (
  userId: string,
  primarySessionId: string | null | undefined,
): Promise<boolean> => {
  if (!primarySessionId) return false;

  // Check if the primary session still exists in Redis
  const primaryKey = CACHE_KEYS.USER_SESSION(userId, primarySessionId);
  const primaryExists = await upstashClient.exists(primaryKey);

  // If primary session is expired/deleted, wipe all other sessions
  if (!primaryExists) {
    const allSessions = await findUserSessions(userId);
    if (allSessions.length > 0) {
      const keysToDelete = allSessions.map((s) => s.key);
      await upstashClient.del(...keysToDelete);
    }
    return true; // Indicates a wipe happened
  }

  return false;
};
