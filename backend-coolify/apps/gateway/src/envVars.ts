import { getEnv, IAuthConfig, loadEnv } from "@repo/shared";
import { RequestHandler } from "express";

if (process.env.NODE_ENV !== "production") {
  loadEnv();
}

/**
 * Core Gateway Environment Variables
 */
export const env = {
  get NODE_ENV() {
    return getEnv("NODE_ENV");
  },
  get MONGO_URI() {
    return getEnv("MONGO_URI");
  },
  get PORT() {
    return parseInt(getEnv("GATEWAY_PORT", false) || "8000", 10);
  },
  get GATEWAY_URL() {
    return getEnv("GATEWAY_URL");
  },
  get ACCOUNT_URL() {
    return getEnv("ACCOUNT_URL");
  },
  get POST_URL() {
    return getEnv("POST_URL");
  },
  get PLATFORM_URL() {
    return getEnv("PLATFORM_URL");
  },
  get WORKER_URL() {
    return getEnv("WORKER_URL");
  },

  get FUNSTAKES_REDIS_URL() {
    return getEnv("FUNSTAKES_REDIS_URL");
  },
};

// Legacy Compatibility Exports
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const MONGO_URI = env.MONGO_URI;
export const GATEWAY_URL = env.GATEWAY_URL;
export const ACCOUNT_URL = env.ACCOUNT_URL;
export const POST_URL = env.POST_URL;
export const PLATFORM_URL = env.PLATFORM_URL;
export const WORKER_URL = env.WORKER_URL;
export const FUNSTAKES_REDIS_URL = env.FUNSTAKES_REDIS_URL;
