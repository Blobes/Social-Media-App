import type { RequestHandler } from "express";
import {
  createVerifyAuthToken,
  getEnv,
  IAuthConfig,
  loadEnv,
} from "@repo/shared";

if (process.env.NODE_ENV !== "production") {
  loadEnv();
}

/**
 * Core Administrative Environment Variables
 */
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
  get OPENAI_API_KEY() {
    return getEnv("OPENAI_API_KEY");
  },
};

/**
 * Authentication Configuration for Admin routes
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
 * Middleware instance for verifying admin-level auth tokens
 */
export const verifyAuthToken: RequestHandler =
  createVerifyAuthToken(authConfig);

// Direct export for legacy compatibility where required
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const MONGO_URI = env.MONGO_URI;
export const OPENAI_API_KEY = env.OPENAI_API_KEY;
