import jwt from "jsonwebtoken";
import { IJwtUser } from "../types";
import { upstashClient } from "./upstash";
import { CACHE_KEYS } from "../utils/redis/cache";
import { Response } from "express";

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
 * Optionally preserves the primary device session even during a global clear.
 */
export const cleanDeviceSessions = async (
  userId: string,
  targetDeviceIds?: string | string[],
  options: {
    clearAll?: boolean;
    preservePrimary?: boolean;
    primaryDeviceId?: string | null;
  } = {},
): Promise<boolean> => {
  const {
    clearAll = false,
    preservePrimary = false,
    primaryDeviceId = null,
  } = options;

  try {
    const allSessions = await findUserSessions(userId);
    if (allSessions.length === 0) return false;

    const targetIds = Array.isArray(targetDeviceIds)
      ? targetDeviceIds
      : targetDeviceIds
        ? [targetDeviceIds]
        : [];

    const sessionDataResults = await Promise.all(
      allSessions.map(async (s) => ({
        key: s.key,
        sessionId: s.sessionId,
        data: (await upstashClient.get(s.key)) as any,
      })),
    );

    const keysToDelete: string[] = [];
    let wasPrimaryPreserved = false;

    for (const { key, data } of sessionDataResults) {
      if (!data) continue;

      // Check if this specific session belongs to the primary device
      const isPrimaryDevice =
        primaryDeviceId && data.deviceId === primaryDeviceId;

      // Preservation Logic: Skip deletion if it's the primary device and we flagged it for preservation
      if (preservePrimary && isPrimaryDevice) {
        wasPrimaryPreserved = true;
        continue;
      }

      const shouldDelete =
        clearAll || (targetIds.length > 0 && targetIds.includes(data.deviceId));

      if (shouldDelete) {
        keysToDelete.push(key);
      }
    }

    if (keysToDelete.length > 0) {
      await upstashClient.del(...keysToDelete);
    }
    return wasPrimaryPreserved;
  } catch (error) {
    console.error("Device Session Cleanup Error:", error);
    throw new Error("Failed to process hardware-based session cleanup");
  }
};

/**
 * Generates an Access Token and embeds session/device mapping.
 */
export const signAccessJwt = (
  user: IJwtUser,
  sessionId: string,
  accessTokenSecret: string,
) => {
  const userId = user.id.toString();
  const deviceId = user.deviceId;
  const accessToken = jwt.sign(
    {
      ...user,
      id: userId,
      deviceId,
      sessionId,
    },
    accessTokenSecret,
    { expiresIn: "15m" },
  );
  return accessToken;
};

/**
 * Generates a signed Refresh JWT and registers the session metadata in Redis.
 */
export const signRefreshJwt = async (
  user: IJwtUser,
  sessionId: string,
  refreshSecret: string,
  userAgent: string,
  ipAddress: string,
) => {
  const userId = user.id.toString();
  const deviceId = user.deviceId;

  // Signing the Refresh JWT with hardware and session binding
  const refreshToken = jwt.sign(
    { id: userId, sessionId, deviceId },
    refreshSecret,
    { expiresIn: "7d" },
  );
  // Mapping the session ID to the physical hardware fingerprint in Redis
  const sessionKey = CACHE_KEYS.USER_SESSION(userId, sessionId);
  await upstashClient.set(
    sessionKey,
    {
      deviceId,
      userAgent,
      ip: ipAddress,
      lastActive: new Date(),
    },
    { ex: 20 * 24 * 60 * 60 },
  );
  return refreshToken;
};

export const setAuthCookies = (
  res: Response,
  tokens: {
    accessToken?: string;
    refreshToken?: string;
  },
  authType: "ACCESS" | "REFRESH" | "BOTH" = "BOTH",
) => {
  if (tokens.accessToken && (authType === "ACCESS" || authType === "BOTH")) {
    res.cookie("access_token", tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".funstakes.net",
      path: "/",
      maxAge: 30 * 60 * 1000,
    });
    // Client-side hint for UI state management
    res.cookie("is_logged_in", "true", {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      domain: ".funstakes.net",
      maxAge: 30 * 60 * 1000,
    });
  }

  if (tokens.refreshToken && (authType === "REFRESH" || authType === "BOTH")) {
    res.cookie("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".funstakes.net",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  res.clearCookie("is_logged_in", {
    httpOnly: false,
    secure: true,
    sameSite: "none",
  });
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
};
