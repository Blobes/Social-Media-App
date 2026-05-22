import {
  createVerifyAuthToken,
  getEnv,
  IS3Config,
  loadEnv,
} from "@repo/shared";
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
  get ADMIN_URL() {
    return getEnv("ADMIN_URL");
  },
  get WORKER_URL() {
    return getEnv("WORKER_URL");
  },

  get FUNSTAKES_REDIS_URL() {
    return getEnv("FUNSTAKES_REDIS_URL");
  },
};

/**
 * AWS S3 Configuration
 */
export const s3Config: IS3Config = {
  get REGION() {
    return getEnv("AWS_REGION");
  },
  get ACCESS_KEY_ID() {
    return getEnv("AWS_ACCESS_KEY");
  },
  get SECRET_ACCESS_KEY() {
    return getEnv("AWS_SECRET_KEY");
  },
  get BUCKET_NAME() {
    return getEnv("AWS_BUCKET_NAME");
  },
};

/**
 * Authentication Middleware and Configuration
 */
const authConfig = {
  get ACCESS_TOKEN_SECRET() {
    return getEnv("JWT_SECRET");
  },
  get REFRESH_TOKEN_SECRET() {
    return getEnv("REFRESH_TOKEN_SECRET");
  },
};

export const verifyAuthToken: RequestHandler =
  createVerifyAuthToken(authConfig);

// Legacy Compatibility Exports
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const MONGO_URI = env.MONGO_URI;
export const GATEWAY_URL = env.GATEWAY_URL;
export const ACCOUNT_URL = env.ACCOUNT_URL;
export const POST_URL = env.POST_URL;
export const ADMIN_URL = env.ADMIN_URL;
export const WORKER_URL = env.WORKER_URL;
export const FUNSTAKES_REDIS_URL = env.FUNSTAKES_REDIS_URL;
