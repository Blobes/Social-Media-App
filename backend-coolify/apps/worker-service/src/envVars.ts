import {
  getEnv,
  ICodeDispatchTokens,
  IEmailDispatchTokens,
  IPhoneDispatchTokens,
  loadEnv,
} from "@repo/shared";

if (process.env.NODE_ENV !== "production") {
  loadEnv("worker");
}

/**
 * Core Worker Service Environment Variables
 */
export const env = {
  get NODE_ENV() {
    return getEnv("NODE_ENV");
  },
  get MONGO_URI() {
    return getEnv("MONGO_URI");
  },
  get PORT() {
    return parseInt(getEnv("WORKER_PORT", false) || "8083", 10);
  },
  get SERVICE_URL() {
    return getEnv("WORKER_URL");
  },
  get FUNSTAKES_REDIS_URL() {
    return getEnv("FUNSTAKES_REDIS_URL");
  },
  get OPENAI_API_KEY() {
    return getEnv("OPENAI_API_KEY");
  },
};

/**
 * Configuration for email providers including Resend, OAuth2 (Gmail),
 * and standard SMTP relays.
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
 * Configuration for Meta WhatsApp Business API integration.
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

/**
 * Legacy Compatibility Exports
 * Preserves support for existing 'import { VAR } from "./config"' patterns.
 */
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const MONGO_URI = env.MONGO_URI;
export const SERVICE_URL = env.SERVICE_URL;
export const FUNSTAKES_REDIS_URL = env.FUNSTAKES_REDIS_URL;
export const OPENAI_API_KEY = env.OPENAI_API_KEY;
