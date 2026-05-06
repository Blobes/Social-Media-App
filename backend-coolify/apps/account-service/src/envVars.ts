import type { RequestHandler } from "express";
import {
  IAuthConfig,
  ICodeDispatchTokens,
  IEmailDispatchTokens,
  IPhoneDispatchTokens,
  createVerifyAuthToken,
  getEnv,
  loadEnv,
} from "@repo/shared";

if (process.env.NODE_ENV !== "production") {
  loadEnv();
}

/**
 * Core Application Environment Variables
 */
export const env = {
  get NODE_ENV() {
    return getEnv("NODE_ENV");
  },
  get MONGO_URI() {
    return getEnv("MONGO_URI");
  },
  get PORT() {
    return parseInt(getEnv("ACCOUNT_PORT", false) || "8080", 10);
  },
  get FUNSTAKES_REDIS_URL() {
    return getEnv("FUNSTAKES_REDIS_URL");
  },
};

/**
 * Authentication Configuration
 */
export const authTokens: IAuthConfig = {
  get ACCESS_TOKEN_SECRET() {
    return getEnv("JWT_SECRET");
  },
  get REFRESH_TOKEN_SECRET() {
    return getEnv("REFRESH_TOKEN_SECRET");
  },
};

/**
 * Email Provider Configuration
 */
export const emailDispatchTokens: IEmailDispatchTokens = {
  get RESEND_API_KEY() {
    return getEnv("RESEND_API_KEY", false);
  },
  get RESEND_FROM_EMAIL() {
    return getEnv("RESEND_FROM", false);
  },
  get GMAIL_USER() {
    return getEnv("GMAIL_USER", false);
  },
  get GMAIL_CLIENT_ID() {
    return getEnv("GMAIL_CLIENT_ID", false);
  },
  get GMAIL_CLIENT_SECRET() {
    return getEnv("GMAIL_CLIENT_SECRET", false);
  },
  get GMAIL_REFRESH_TOKEN() {
    return getEnv("GMAIL_REFRESH_TOKEN", false);
  },
  get HOTMAIL_USER() {
    return getEnv("HOTMAIL_USER", false);
  },
  get HOTMAIL_PASSWORD() {
    return getEnv("HOTMAIL_PASS", false);
  },
  get HOTMAIL_FROM_EMAIL() {
    return getEnv("HOTMAIL_FROM", false);
  },
  get YAHOO_USER() {
    return getEnv("YAHOO_USER", false);
  },
  get YAHOO_PASSWORD() {
    return getEnv("YAHOO_PASS", false);
  },
  get YAHOO_FROM_EMAIL() {
    return getEnv("YAHOO_FROM_EMAIL", false);
  },
  get SMTP_HOST_EMAIL() {
    return getEnv("SMTP_HOST_EMAIL", false);
  },
  get SMTP_PORT() {
    return getEnv("SMTP_HOST_PORT", false);
  },
  get SMTP_USER() {
    return getEnv("SMTP_USER", false);
  },
  get SMTP_PASSWORD() {
    return getEnv("SMTP_PASSWORD", false);
  },
};

/**
 * Phone and WhatsApp Configuration
 */
export const phoneDispatchTokens: IPhoneDispatchTokens = {
  get WHATSAPP_API_URL() {
    return getEnv("WHATSAPP_API_URL", false);
  },
  get WHATSAPP_ACCESS_KEY() {
    return getEnv("WHATSAPP_ACCESS_KEY", false);
  },
  get WHATSAPP_PHONE_NUMBER_ID() {
    return getEnv("WHATSAPP_PHONE_NUMBER_ID", false);
  },
  get WHATSAPP_BUSINESS_ACCOUNT_ID() {
    return getEnv("WHATSAPP_BUSINESS_ACCOUNT_ID", false);
  },
};

/**
 * Unified dispatch tokens for full-stack context.
 */
export const codeDispatchTokens: ICodeDispatchTokens = {
  ...emailDispatchTokens,
  ...phoneDispatchTokens,
};

export const verifyAuthToken: RequestHandler =
  createVerifyAuthToken(authTokens);

// Legacy Compatibility Exports
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const MONGO_URI = env.MONGO_URI;
export const FUNSTAKES_REDIS_URL = env.FUNSTAKES_REDIS_URL;
