// packages/shared/src/cache.ts
import { redisClient } from "../../services/redis"; // Adjusted path to your new init file

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
  // 1. Upstash REST SDK can return the object directly if stored as JSON
  const cachedData = await redisClient.get<T>(key);

  if (cachedData) {
    // No JSON.parse needed with @upstash/redis get<T>
    return cachedData;
  }

  // 2. Fetch fresh data from MongoDB if cache miss
  const freshData = await cb();

  if (freshData) {
    // 3. Store in Redis.
    // Use { ex: seconds } for Upstash instead of setEx
    await redisClient.set(key, freshData, { ex: expiry });
  }

  return freshData;
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
    await redisClient.unlink(key);
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
      const [nextCursor, keys] = await redisClient.scan(cursor, {
        match: pattern,
        count: 100,
      });

      if (keys.length > 0) {
        // Use 'unlink' for non-blocking deletion in the Redis engine
        await redisClient.unlink(...keys);
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
  const cachedSet = await redisClient.smembers(key);

  if (cachedSet && cachedSet.length > 0) {
    return cachedSet;
  }

  // 2. Fallback to DB
  const freshIds = await cb();

  if (freshIds && freshIds.length > 0) {
    // 3. Use SADD to store multiple IDs at once
    await redisClient.sadd(key, ...(freshIds as [string, ...string[]]));
    await redisClient.expire(key, expiry);
  }

  return freshIds;
};

/**
 * atomicCacheSetUpdate: For adding/removing items without invalidating the whole set
 */
export const atomicCacheSetUpdate = {
  add: (key: string, value: string) => redisClient.sadd(key, value),
  remove: (key: string, value: string) => redisClient.srem(key, value),
};
