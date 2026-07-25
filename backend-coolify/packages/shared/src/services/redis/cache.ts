import { Redis } from "ioredis";
import { CACHE_EXPIRY } from "../../constants/cacheKeys";

/**
 * Reusable Cache Service managing native ioredis instances and cached data operations.
 */
export class CacheService {
  private static redisInstance: Redis | null = null;

  /**
   * Initializes or returns the existing Redis client connection pool.
   */
  public static getClient(redisUrl?: string): Redis {
    if (!this.redisInstance) {
      const url = redisUrl || process.env.FUNSTAKES_REDIS_URL;

      if (!url) {
        throw new Error("FUNSTAKES_REDIS_URL is missing");
      }

      this.redisInstance = new Redis(url, {
        maxRetriesPerRequest: null,
        connectTimeout: 10000,
      });

      this.redisInstance.on("error", (err) => {
        console.error("❌ Shared Cache Engine Redis Error:", err.message);
      });

      console.log("🚀 Native Redis Cache Pool Connected");
    }
    return this.redisInstance;
  }

  /**
   * Direct GET key lookup with JSON parsing.
   */
  public static async get<T = any>(
    key: string,
    redisUrl?: string,
  ): Promise<T | null> {
    try {
      const client = this.getClient(redisUrl);
      const rawData = await client.get(key);
      if (!rawData) return null;
      return JSON.parse(rawData) as T;
    } catch (error: any) {
      console.error(`[Cache-Error] Failed to GET key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Direct SET key storing JSON values with optional expiry in seconds.
   */
  public static async set(
    key: string,
    value: any,
    expiryInSeconds?: number,
    redisUrl?: string,
  ): Promise<void> {
    try {
      const client = this.getClient(redisUrl);
      const serialized =
        typeof value === "string" ? value : JSON.stringify(value);

      if (expiryInSeconds) {
        await client.set(key, serialized, "EX", expiryInSeconds);
      } else {
        await client.set(key, serialized);
      }
    } catch (error: any) {
      console.error(`[Cache-Error] Failed to SET key ${key}:`, error.message);
    }
  }

  /**
   * Fetches data from cache or evaluates fallback function and caches the result.
   */
  public static async getOrSet<T>(
    key: string,
    cb: () => Promise<T>,
    expiry = 3600,
    redisUrl?: string,
  ): Promise<T> {
    try {
      const client = this.getClient(redisUrl);
      const rawData = await client.get(key);

      if (rawData) {
        return JSON.parse(rawData) as T;
      }

      const freshData = await cb();
      if (freshData !== undefined && freshData !== null) {
        client
          .set(key, JSON.stringify(freshData), "EX", expiry)
          .catch((err) =>
            console.error(
              `[Cache-Error] Failed to set key ${key}:`,
              err.message,
            ),
          );
      }
      return freshData;
    } catch (error: any) {
      console.error(
        `[Cache-Error] Redis get failed for ${key}:`,
        error.message,
      );
      return await cb();
    }
  }

  /**
   * Non-blocking key deletion using UNLINK.
   */
  public static async invalidate(
    key: string,
    redisUrl?: string,
  ): Promise<void> {
    try {
      const client = this.getClient(redisUrl);
      await client.unlink(key);
    } catch (error) {
      console.error(`Redis Invalidation Error for key ${key}:`, error);
    }
  }

  /**
   * Scans and non-blocking unlinks keys matching a pattern.
   */
  public static async invalidatePattern(
    pattern: string,
    redisUrl?: string,
  ): Promise<void> {
    try {
      const client = this.getClient(redisUrl);
      let cursor = "0";

      do {
        const [nextCursor, keys] = await client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );

        if (keys.length > 0) {
          await client.unlink(...keys);
        }

        cursor = nextCursor;
      } while (cursor !== "0");
    } catch (error) {
      console.error(`Redis Pattern Invalidation Error (${pattern}):`, error);
    }
  }

  /**
   * Set cache handler for set data structures.
   */
  public static async getOrSetSet(
    key: string,
    cb: () => Promise<string[]>,
    expiry = 86400,
    redisUrl?: string,
  ): Promise<string[]> {
    try {
      const client = this.getClient(redisUrl);
      const cachedSet = await client.smembers(key);

      if (cachedSet && cachedSet.length > 0) {
        return cachedSet;
      }

      const freshIds = await cb();

      if (freshIds && freshIds.length > 0) {
        const pipeline = client.pipeline();
        pipeline.sadd(key, ...freshIds);
        pipeline.expire(key, expiry);
        await pipeline.exec();
      }

      return freshIds;
    } catch (error: any) {
      console.error(`[CacheSet-Error] Failed for key ${key}:`, error.message);
      return await cb();
    }
  }

  /**
   * Atomic addition to set.
   */
  public static async setAdd(
    key: string,
    value: string,
    redisUrl?: string,
  ): Promise<number> {
    const client = this.getClient(redisUrl);
    return await client.sadd(key, value);
  }

  /**
   * Atomic removal from set.
   */
  public static async setRemove(
    key: string,
    value: string,
    redisUrl?: string,
  ): Promise<number> {
    const client = this.getClient(redisUrl);
    return await client.srem(key, value);
  }

  /**
   * Checks if a key exists in Redis cache.
   */
  public static async exists(key: string, redisUrl?: string): Promise<boolean> {
    try {
      const client = this.getClient(redisUrl);
      const count = await client.exists(key);
      return count > 0;
    } catch (error: any) {
      console.error(
        `[Cache-Error] Failed EXISTS check for key ${key}:`,
        error.message,
      );
      return false;
    }
  }

  /**
   * Deletes one or more keys from Redis.
   */
  public static async del(
    keys: string | string[],
    redisUrl?: string,
  ): Promise<number> {
    try {
      const client = this.getClient(redisUrl);
      const keysToDelete = Array.isArray(keys) ? keys : [keys];
      if (keysToDelete.length === 0) return 0;
      return await client.del(...keysToDelete);
    } catch (error: any) {
      console.error(
        `[Cache-Error] Failed DEL operation for keys:`,
        error.message,
      );
      return 0;
    }
  }

  /**
   * Scans keys matching a specific pattern using cursor-based iteration.
   */
  public static async scan(
    cursor: string,
    pattern: string,
    count = 100,
    redisUrl?: string,
  ): Promise<[string, string[]]> {
    try {
      const client = this.getClient(redisUrl);
      return await client.scan(cursor, "MATCH", pattern, "COUNT", count);
    } catch (error: any) {
      console.error(
        `[Cache-Error] Failed SCAN for pattern ${pattern}:`,
        error.message,
      );
      return ["0", []];
    }
  }

  /**
   * Executes a batch GET pipeline for multiple keys with JSON parsing.
   */
  public static async pipelineGet<T = any>(
    keys: string[],
    redisUrl?: string,
  ): Promise<(T | null)[]> {
    if (keys.length === 0) return [];

    try {
      const client = this.getClient(redisUrl);
      const pipeline = client.pipeline();

      keys.forEach((key) => pipeline.get(key));
      const results = await pipeline.exec();

      if (!results) return keys.map(() => null);

      return results.map(([err, rawData]) => {
        if (err || !rawData || typeof rawData !== "string") {
          return null;
        }

        try {
          return JSON.parse(rawData) as T;
        } catch {
          return rawData as unknown as T;
        }
      });
    } catch (error: any) {
      console.error(`[Cache-Error] Failed pipeline GET:`, error.message);
      return keys.map(() => null);
    }
  }

  /**
   * Executes an atomic sliding window rate limit check.
   */
  public static async checkSlidingWindow(
    identifier: string,
    limit: number,
    windowSeconds = 60,
    redisUrl?: string,
  ): Promise<{ isAllowed: boolean; currentUsage: number }> {
    try {
      const client = this.getClient(redisUrl);
      const now = Date.now();
      const currentWindow = Math.floor(now / (windowSeconds * 1000));
      const previousWindow = currentWindow - 1;

      const currentKey = `ratelimit:${identifier}:${currentWindow}`;
      const previousKey = `ratelimit:${identifier}:${previousWindow}`;

      const pipeline = client.pipeline();
      pipeline.get(previousKey);
      pipeline.incr(currentKey);
      pipeline.expire(currentKey, windowSeconds * 2);

      const results = await pipeline.exec();

      if (!results) {
        return { isAllowed: true, currentUsage: 0 };
      }

      const [prevErr, rawPrevCount] = results[0];
      const [currErr, rawCurrCount] = results[1];

      const prevValue =
        !prevErr && rawPrevCount
          ? parseInt(rawPrevCount as string, 10) || 0
          : 0;
      const currValue =
        !currErr && rawCurrCount ? (rawCurrCount as number) || 0 : 0;

      const timePassedInWindow = now % (windowSeconds * 1000);
      const weight =
        (windowSeconds * 1000 - timePassedInWindow) / (windowSeconds * 1000);

      const estimate = currValue + prevValue * weight;

      return {
        isAllowed: estimate <= limit,
        currentUsage: Math.floor(estimate),
      };
    } catch (error: any) {
      console.error(
        `[Cache-Error] Sliding window check failed for ${identifier}:`,
        error.message,
      );
      return { isAllowed: true, currentUsage: 0 };
    }
  }
}

export const initCacheClient = async (redisUrl?: string): Promise<Redis> => {
  const client = CacheService.getClient(redisUrl);
  try {
    const status = await client.ping();
    console.log(`✅ Redis cache connected: ${status}`);
  } catch (err) {
    console.error("⚠️ Redis cache connectivity check failed:", err);
  }

  return client;
};

/**
 * Direct fetch wrapper from Redis.
 */
export const getCache = <T = any>(key: string): Promise<T | null> =>
  CacheService.get<T>(key);

/**
 * Direct set wrapper for Redis.
 */
export const setCache = (
  key: string,
  value: any,
  expiryInSeconds = CACHE_EXPIRY.HOUR_1,
): Promise<void> => CacheService.set(key, value, expiryInSeconds);

/**
 * High-performance wrapper for cached data requests.
 */
export const getOrSetCache = <T>(
  key: string,
  cb: () => Promise<T>,
  expiryInSeconds = CACHE_EXPIRY.MIN_3,
): Promise<T> => CacheService.getOrSet(key, cb, expiryInSeconds);

/**
 * Optimized for Sets (Block lists, Muted users).
 */
export const getOrSetCacheSet = (
  key: string,
  cb: () => Promise<string[]>,
  expiryInSeconds = CACHE_EXPIRY.HOUR_24,
): Promise<string[]> => CacheService.getOrSetSet(key, cb, expiryInSeconds);

/**
 * Invalidates a single key.
 */
export const invalidateCache = (key: string): Promise<void> =>
  CacheService.invalidate(key);

/**
 * Invalidates keys matching a specific string pattern.
 */
export const invalidatePattern = (pattern: string): Promise<void> =>
  CacheService.invalidatePattern(pattern);

/**
 * Atomic set update handlers.
 */
export const atomicCacheSetUpdate = {
  add: (key: string, value: string) => CacheService.setAdd(key, value),
  remove: (key: string, value: string) => CacheService.setRemove(key, value),
};

/**
 * Checks if a key exists in Redis cache.
 */
export const existsInCache = (key: string): Promise<boolean> =>
  CacheService.exists(key);

/**
 * Deletes one or more keys from Redis cache.
 */
export const deleteCache = (keys: string | string[]): Promise<number> =>
  CacheService.del(keys);

/**
 * Scans keys matching a specific pattern using cursor-based iteration.
 */
export const scanCache = (
  cursor: string,
  pattern: string,
  count = 100,
): Promise<[string, string[]]> => CacheService.scan(cursor, pattern, count);

/**
 * Executes a batch GET pipeline for multiple keys.
 */
export const pipelineGetCache = <T = any>(
  keys: string[],
): Promise<(T | null)[]> => CacheService.pipelineGet<T>(keys);

/**
 * Evaluates sliding window rate limits using Redis pipelines.
 */
export const checkSlidingWindow = (
  identifier: string,
  limit: number,
  windowSeconds = 60,
): Promise<{ isAllowed: boolean; currentUsage: number }> =>
  CacheService.checkSlidingWindow(identifier, limit, windowSeconds);
