import type { RequestHandler } from "express";
import {
  createOptionalVerifyToken,
  createVerifyAuthToken,
  getEnv,
  IAuthConfig,
  loadEnv,
} from "@repo/shared";

if (process.env.NODE_ENV !== "production") {
  loadEnv("post");
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
  get OPENAI_API_KEY() {
    return getEnv("OPENAI_API_KEY");
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
 * Middleware instances for strict and optional authentication
 */
export const verifyAuthToken: RequestHandler =
  createVerifyAuthToken(authConfig);

export const optionalAuth: RequestHandler =
  createOptionalVerifyToken(authConfig);

/**
 * Legacy Compatibility Exports
 * Maintains support for existing 'import { VAR } from "./config"' patterns.
 */
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const MONGO_URI = env.MONGO_URI;
export const SERVICE_URL = env.SERVICE_URL;
export const FUNSTAKES_REDIS_URL = env.FUNSTAKES_REDIS_URL;
export const OPENAI_API_KEY = env.OPENAI_API_KEY;
