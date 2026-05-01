import { upstashClient } from "../../services/upstash"; // Adjusted path to your new init file
import { PostType } from "../../types/types";

/**
 * getOrSetCache: High-performance wrapper for Upstash REST
 * @param key The unique identifier for the cache
 * @param cb The database fetch function (fallback)
 * @param expiry Time to live in seconds (default 1 hour)
 */

export const getOrSetCache = async <T>(
  key: string,
  cb: () => Promise<T>,
  expiry = 3600,
): Promise<T> => {
  // Safety Check: If upstashClient wasn't initialized, skip cache and hit DB
  if (!upstashClient) {
    console.warn(
      `[Cache-Warning] upstashClient is undefined for key: ${key}. Falling back to DB.`,
    );
    return await cb();
  }

  try {
    const cachedData = await upstashClient.get<T>(key);

    if (cachedData) {
      return cachedData;
    }

    const freshData = await cb();
    if (freshData) {
      // not 'awaiting' the set operation here to speed up the response,
      // but catching errors so they don't crash the request.
      upstashClient
        .set(key, freshData, { ex: expiry })
        .catch((err) =>
          console.error(`[Cache-Error] Failed to set key ${key}:`, err.message),
        );
    }
    return freshData;
  } catch (error: any) {
    // If Upstash/Network fails, fall back to the DB instead of throwing a 500
    console.error(`[Cache-Error] Redis get failed for ${key}:`, error.message);
    return await cb();
  }
};

/**
 * Invalidate cache
 * @param key
 */
export const invalidateCache = async (key: string): Promise<void> => {
  try {
    // We use 'unlink' instead of 'del' for better performance at scale.
    // 'unlink' deletes the key in a different thread, so it doesn't
    // block the main Redis event loop (crucial for large objects).
    await upstashClient.unlink(key);
  } catch (error) {
    // Log the error but don't throw it. The app should keep running
    // even if the cache fails to clear (the TTL will eventually expire it).
    console.error(`Redis Invalidation Error for key ${key}:`, error);
  }
};

export const invalidatePattern = async (pattern: string): Promise<void> => {
  try {
    let cursor = "0";

    do {
      // Upstash 'scan' returns [newCursor, matchingKeys]
      const [nextCursor, keys] = await upstashClient.scan(cursor, {
        match: pattern,
        count: 100,
      });

      if (keys.length > 0) {
        // Use 'unlink' for non-blocking deletion in the Redis engine
        await upstashClient.unlink(...keys);
      }

      cursor = nextCursor;
    } while (cursor !== "0");
  } catch (error) {
    console.error(`Upstash Invalidation Error (${pattern}):`, error);
  }
};

/**
 * getOrSetCacheSet: Optimized for Sets (Block lists, Muted users)
 * Uses Redis SADD and SMEMBERS for O(1) membership checks.
 */
export const getOrSetCacheSet = async (
  key: string,
  cb: () => Promise<string[]>,
  expiry = 86400, // Default 24h for relationship data
): Promise<string[]> => {
  // 1. Fetch all members from the Redis Set
  const cachedSet = await upstashClient.smembers(key);

  if (cachedSet && cachedSet.length > 0) {
    return cachedSet;
  }

  // 2. Fallback to DB
  const freshIds = await cb();

  if (freshIds && freshIds.length > 0) {
    // 3. Use SADD to store multiple IDs at once
    await upstashClient.sadd(key, ...(freshIds as [string, ...string[]]));
    await upstashClient.expire(key, expiry);
  }

  return freshIds;
};

/**
 * atomicCacheSetUpdate: For adding/removing items without invalidating the whole set
 */
export const atomicCacheSetUpdate = {
  add: (key: string, value: string) => upstashClient.sadd(key, value),
  remove: (key: string, value: string) => upstashClient.srem(key, value),
};

/**
 * Redis Cache Key Registry
 * Centralizes all key patterns for the Funstakes ecosystem.
 * High-performance note: leading with userId allows O(K) invalidation.
 */
export const CACHE_KEYS = {
  // --- Session & Security ---
  USER_SESSION: (userId: string, sessionId: string) =>
    `session:${userId}:${sessionId}`,
  USER_PRIMARY_DEVICE: (userId: string) => `user:${userId}:primary_device_id`,
  WILDCARD_USER_SESSIONS: (userId: string) => `session:${userId}:*`,
  DEVICE_TRUST_STATUS: (userId: string, deviceId: string) =>
    `trust_check:${userId}:${deviceId}`,

  // --- Feed Keys (Dynamic/Personalized) ---
  USER_FOLLOWERS_FEED: (userId: string, page: number, limit: number) =>
    `user:${userId}:feed:followers:p${page}:l${limit}`,
  USER_PROFILE_FEED: (userId: string, page: number, limit: number) =>
    `user:${userId}:feed:profile:p${page}:l${limit}`,

  // --- Static/Global Feeds ---
  GLOBAL_FEED: (page: number, limit: number) =>
    `feed:all:static:p${page}:l${limit}`,
  POST_FEED_TYPE: (postType: PostType, page: number, limit: number) =>
    `feed:${postType.toLowerCase()}s:static:p${page}:l${limit}`,

  // --- Entity Keys ---
  POST: (postType: PostType, postId: string) =>
    `post:${postType.toLowerCase()}:${postId}`,

  // --- Social & Identity (O(1) lookups) ---
  USER_BASE: (userId: string) => `user:${userId}`,
  USER_PROFILE: (userId: string) => `user:${userId}:profile`,
  USER_FOLLOWING: (userId: string) => `user:${userId}:following`,
  USER_FOLLOWERS: (userId: string, page: number, limit: number) =>
    `user:${userId}:followers:${userId}:p:${page}:l:${limit}`,
  USER_BLOCKINGS: (userId: string) => `user:${userId}:blockings`, // List of users blocked by this user
  USER_BLOCKERS: (userId: string) => `user:${userId}:blockers`, // List of users that has blocked this user

  USER_PREFERENCES: (userId: string) => `user:${userId}:prefs`,

  // --- Invalidation Patterns (Wildcards) ---
  // Wipes all global first pages (Gists, Stakes, All)
  GLOBAL_FEED_PAGE_ONE: "feed:*:static:p1:*",
  // Wipes every paginated feed chunk authored or viewed by the user
  WILDCARD_USER_FEED_ALL: (userId: string) => `user:${userId}:feed:*`,
  // The complete account wipe pattern
  WILDCARD_USER_ALL: (userId: string) => `user:${userId}:*`,
  WILDCARD_POST_FEED_TYPE: (postType: PostType) =>
    `feed:${postType.toLowerCase()}:*`,
};
