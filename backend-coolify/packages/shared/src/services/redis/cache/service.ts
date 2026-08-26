import { Redis } from "ioredis";
import { CACHE_EXPIRY } from "../../../constants/cacheKeys";

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

      this.redisInstance.on("error", (err: Error) => {
        console.error("❌ Shared Cache Engine Redis Error:", err.message);
      });

      console.log("🚀 Native Redis Cache Pool Connected");
    }
    return this.redisInstance;
  }

  /**
   * Direct GET key lookup with JSON parsing.
   */
  public static async get<T = unknown>(
    key: string,
    redisUrl?: string,
  ): Promise<T | null> {
    try {
      const client = this.getClient(redisUrl);
      const rawData = await client.get(key);
      if (!rawData) return null;
      return JSON.parse(rawData) as T;
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`[Cache-Error] Failed to GET key ${key}:`, err.message);
      return null;
    }
  }

  /**
   * Direct SET key storing JSON values with optional expiry in seconds.
   */
  public static async set<T = unknown>(
    key: string,
    value: T,
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
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`[Cache-Error] Failed to SET key ${key}:`, err.message);
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
          .catch((err: Error) =>
            console.error(
              `[Cache-Error] Failed to set key ${key}:`,
              err.message,
            ),
          );
      }
      return freshData;
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`[Cache-Error] Redis get failed for ${key}:`, err.message);
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`[CacheSet-Error] Failed for key ${key}:`, err.message);
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
    } catch (error: unknown) {
      const err = error as Error;
      console.error(
        `[Cache-Error] Failed EXISTS check for key ${key}:`,
        err.message,
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
    } catch (error: unknown) {
      const err = error as Error;
      console.error(
        `[Cache-Error] Failed DEL operation for keys:`,
        err.message,
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
    } catch (error: unknown) {
      const err = error as Error;
      console.error(
        `[Cache-Error] Failed SCAN for pattern ${pattern}:`,
        err.message,
      );
      return ["0", []];
    }
  }

  /**
   * Executes a batch GET pipeline for multiple keys with JSON parsing.
   */
  public static async pipelineGet<T = unknown>(
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
    } catch (error: unknown) {
      const err = error as Error;
      console.error(`[Cache-Error] Failed pipeline GET:`, err.message);
      return keys.map(() => null);
    }
  }

  /**
   * Stores candidate items with scores into a Redis Sorted Set (ZSET).
   */
  public static async zaddMany(
    key: string,
    items: Array<{ member: string; score: number }>,
    expiryInSeconds?: number,
    redisUrl?: string,
  ): Promise<void> {
    if (items.length === 0) return;

    try {
      const client = this.getClient(redisUrl);
      const pipeline = client.pipeline();

      pipeline.del(key);

      const zaddArgs: (string | number)[] = [];
      items.forEach(({ member, score }) => {
        zaddArgs.push(score, member);
      });

      pipeline.zadd(key, ...zaddArgs);

      if (expiryInSeconds) {
        pipeline.expire(key, expiryInSeconds);
      }

      await pipeline.exec();
    } catch (error: unknown) {
      const err = error as Error;
      console.error(
        `[CacheZSet-Error] Failed ZADD for key ${key}:`,
        err.message,
      );
    }
  }

  /**
   * Fetches paginated members from a Redis Sorted Set in descending order of score.
   */
  public static async zrevrange(
    key: string,
    start: number,
    stop: number,
    redisUrl?: string,
  ): Promise<string[]> {
    try {
      const client = this.getClient(redisUrl);
      return await client.zrevrange(key, start, stop);
    } catch (error: unknown) {
      const err = error as Error;
      console.error(
        `[CacheZSet-Error] Failed ZREVRANGE for key ${key}:`,
        err.message,
      );
      return [];
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
    } catch (error: unknown) {
      const err = error as Error;
      console.error(
        `[Cache-Error] Sliding window check failed for ${identifier}:`,
        err.message,
      );
      return { isAllowed: true, currentUsage: 0 };
    }
  }
}
