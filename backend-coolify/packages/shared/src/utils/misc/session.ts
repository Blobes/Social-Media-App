import { UserModel } from "@repo/database";
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
 * Terminates sessions tied to specific hardware IDs or clears all hardware sessions.
 */
export const cleanDeviceSessions = async (
  userId: string,
  targetDeviceIds?: string | string[],
  clearAll: boolean = false,
): Promise<void> => {
  try {
    const allSessions = await findUserSessions(userId);
    if (allSessions.length === 0) return;

    // Convert single string to array for uniform processing
    const targetIds = Array.isArray(targetDeviceIds)
      ? targetDeviceIds
      : targetDeviceIds
        ? [targetDeviceIds]
        : [];

    // Fetch all session data in parallel to avoid N+1 waterfall
    const sessionDataResults = await Promise.all(
      allSessions.map(async (s) => ({
        key: s.key,
        data: (await upstashClient.get(s.key)) as any,
      })),
    );

    const keysToDelete: string[] = [];

    for (const { key, data } of sessionDataResults) {
      if (!data) continue;

      const shouldDelete =
        clearAll || (targetIds.length > 0 && targetIds.includes(data.deviceId));

      if (shouldDelete) {
        keysToDelete.push(key);
      }
    }

    if (keysToDelete.length > 0) {
      await upstashClient.del(...keysToDelete);
    }
  } catch (error) {
    console.error("Device Session Cleanup Error:", error);
    throw new Error("Failed to process hardware-based session cleanup");
  }
};

/**
 * Only enforces a wipe if the session being validated IS the primary session
 * and it has expired, OR if we want to restrict secondary sessions (optional).
 */
export const enforcePrimarySessionPolicy = async (
  userId: string,
  primarySessionId: string,
  currentSessionId: string,
): Promise<boolean> => {
  const primaryKey = CACHE_KEYS.USER_SESSION(userId, primarySessionId);
  const primaryExists = await upstashClient.exists(primaryKey);

  // If the primary session record is gone from Redis
  if (!primaryExists) {
    // 1. Clear the primary session ID from MongoDB
    await UserModel.findByIdAndUpdate(userId, {
      $unset: { primarySessionId: "" },
    });

    // 2. Clear the primary session cache
    await upstashClient.del(CACHE_KEYS.USER_PRIMARY_DEVICE(userId));

    // 3. Trigger account-wide logout for security
    const allSessions = await upstashClient.keys(
      CACHE_KEYS.USER_SESSION(userId, "*"),
    );
    if (allSessions.length > 0) {
      await upstashClient.del(...allSessions);
    }

    return true; // Wipe occurred
  }

  // If current session is a secondary device, allow it as long as Primary is alive
  if (currentSessionId !== primarySessionId) {
    return false;
  }

  return false;
};
