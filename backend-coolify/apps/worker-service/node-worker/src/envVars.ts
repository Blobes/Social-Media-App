import {
  getEnv,
  ICodeDispatchTokens,
  IEmailDispatchTokens,
  IPhoneDispatchTokens,
  IS3Config,
  loadEnv,
} from "@repo/shared";

if (process.env.NODE_ENV !== "production") {
  loadEnv(true);
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
  get SMTP_HOST_EMAIL() {
    return getEnv("SMTP_HOST_EMAIL", false);
  },
  get SMTP_PORT() {
    return getEnv("SMTP_HOST_PORT", false);
  },
  get SMTP_USER() {
    return getEnv("SMTP_USERNAME", false);
  },
  get SMTP_PASSWORD() {
    return getEnv("SMTP_USER_PASSWORD", false);
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
 * Legacy Compatibility Exports
 * Preserves support for existing 'import { VAR } from "./config"' patterns.
 */
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const MONGO_URI = env.MONGO_URI;
export const SERVICE_URL = env.SERVICE_URL;
export const FUNSTAKES_REDIS_URL = env.FUNSTAKES_REDIS_URL;
