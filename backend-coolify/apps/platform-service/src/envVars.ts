import type { RequestHandler } from "express";
import {
  getEnv,
  IAuthConfig,
  IInternalTokenConfig,
  IS3Config,
  loadEnv,
} from "@repo/shared";
import { verifyAuthTokens, verifyInternalAuth } from "@repo/security";

if (process.env.NODE_ENV !== "production") {
  loadEnv();
}

// Core Administrative Environment Variables
export const env = {
  get NODE_ENV() {
    return getEnv("NODE_ENV");
  },
  get MONGO_URI() {
    return getEnv("MONGO_URI");
  },
  get PORT() {
    return parseInt(getEnv("ADMIN_PORT", false) || "8084", 10);
  },
  get RESEND_WEBHOOK_SECRET() {
    return getEnv("RESEND_WEBHOOK_SECRET");
  },
};

// Authentication Configuration for Admin routes
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

// Middleware instance for verifying admin-level auth tokens
export const authenticate: RequestHandler = verifyAuthTokens(authConfig);

const internalTokenConfig: IInternalTokenConfig = {
  get INTERNAL_TOKEN_SECRET() {
    return getEnv("INTERNAL_SECRET_TOKEN");
  },
};
export const authenticateInternal: RequestHandler =
  verifyInternalAuth(internalTokenConfig);

// Direct export for legacy compatibility where required
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const MONGO_URI = env.MONGO_URI;
export const RESEND_WEBHOOK_SECRET = env.RESEND_WEBHOOK_SECRET;
