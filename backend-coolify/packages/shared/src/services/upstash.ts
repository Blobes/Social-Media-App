// packages/shared/src/redis.ts
import { Redis } from "@upstash/redis";

let upstashClient: Redis;

/**
 * Initializes the Redis client using environment variables.
 */
export const initUpstash = () => {
  // fromEnv() is a static method that handles the lookup for you
  upstashClient = Redis.fromEnv();

  console.log("🚀 Upstash Redis initialized via fromEnv()");
  return upstashClient;
};

export { upstashClient };
