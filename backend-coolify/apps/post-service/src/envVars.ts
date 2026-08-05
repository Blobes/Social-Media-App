import type { RequestHandler } from "express";
import { getEnv, IAuthConfig, IS3Config, loadEnv } from "@repo/shared";
import { verifyAuthOptionally, verifyAuthTokens } from "@repo/security";

if (process.env.NODE_ENV !== "production") {
  loadEnv();
}

/**
 * Core Post Service Environment Variables
 */
export const env = {
  get NODE_ENV() {
    return getEnv("NODE_ENV");
  },
  get MONGO_URI() {
    return getEnv("MONGO_URI");
  },
  get PORT() {
    return parseInt(getEnv("POST_PORT", false) || "8081", 10);
  },
  get SERVICE_URL() {
    return getEnv("POST_URL");
  },
  get FUNSTAKES_REDIS_URL() {
    return getEnv("FUNSTAKES_REDIS_URL");
  },
};

/**
 * Authentication Configuration
 */
export const authConfig: IAuthConfig = {
  get ACCESS_TOKEN_SECRET() {
    return getEnv("JWT_SECRET");
  },
  get REFRESH_TOKEN_SECRET() {
    return getEnv("REFRESH_TOKEN_SECRET");
  },
};

/**
 * Cloud Storage Configuration
 */
export const s3Config: IS3Config = {
  get REGION() {
    return getEnv("CLOUDFLARE_REGION");
  },
  get ACCESS_KEY_ID() {
    return getEnv("CLOUDFLARE_ACCESS_KEY");
  },
  get SECRET_ACCESS_KEY() {
    return getEnv("CLOUDFLARE_SECRET_KEY");
  },
  get BUCKET_NAME() {
    return getEnv("CLOUDFLARE_BUCKET_NAME");
  },
  get ENDPOINT_URL() {
    return getEnv("CLOUDFLARE_ENDPOINT_URL");
  },
  get PUBLIC_URL() {
    return getEnv("CLOUDFLARE_PUBLIC_MEDIA_URL");
  },
};

/**
 * Middleware instances for strict authentication
 */
export const authenticate: RequestHandler = verifyAuthTokens(authConfig);

/**
 * Middleware instances for optional authentication
 */
export const optionallyAuthenticate: RequestHandler =
  verifyAuthOptionally(authConfig);

/**
 * Legacy Compatibility Exports
 * Maintains support for existing 'import { VAR } from "./config"' patterns.
 */
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const MONGO_URI = env.MONGO_URI;
export const SERVICE_URL = env.SERVICE_URL;
export const FUNSTAKES_REDIS_URL = env.FUNSTAKES_REDIS_URL;
