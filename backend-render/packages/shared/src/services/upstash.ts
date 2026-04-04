// packages/shared/src/redis.ts
import { Redis } from "@upstash/redis";

let redisClient: Redis;

/**
 * Initializes the Redis client using environment variables.
 * In your Render dashboard, ensure you have set:
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 */
export const initRedis = () => {
  // fromEnv() is a static method that handles the lookup for you
  redisClient = Redis.fromEnv();

  console.log("🚀 Upstash Redis initialized via fromEnv()");
  return redisClient;
};

export { redisClient };
