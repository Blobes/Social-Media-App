export interface BrandInfo {
  brandName?: string;
  supportEmail?: string;
  domainUrl?: string;
  logoUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
  unsubscribeUrl?: string;
  currentYear?: string;
}

export interface RecipientInfo {
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface CodePayload {
  digit1: string;
  digit2: string;
  digit3: string;
  digit4: string;
  digit5: string;
  digit6: string;
}

/**
 * Composes flat variable types directly from existing interfaces while retaining strict string key records.
 */
export type FlatEmailOtpVariables = Record<string, string | number> &
  Required<RecipientInfo> &
  Required<Omit<BrandInfo, "domainUrl">> &
  CodePayload & {
    verificationUrl: string;
    expiresInMinutes: string;
  };

export interface EmailOtpParams {
  code: string;
  recipient: RecipientInfo;
  expiresInMinutes?: string;
  templateId?: string;
}

/**
 * Payload interface grouping brand, recipient, code, and system metadata.
 */
export interface EmailOtpPayload {
  recipient: RecipientInfo;
  brand: BrandInfo;
  code: CodePayload;
  verificationUrl?: string;
  expiresInMinutes?: string;
}

const BRAND_NAME = "Funstakes";
const DOMAIN_URL = "https://funstakes.net";
const SUPPORT_EMAIL = "support@mail.funstakes.net";
const LOGO_URL = "https://media.funstakes.net/assets/brand-logo2.svg";

const BRAND_INFO: BrandInfo = {
  brandName: BRAND_NAME,
  supportEmail: SUPPORT_EMAIL,
  logoUrl: LOGO_URL,
  facebookUrl: "https://facebook.com",
  twitterUrl: "https://x.com",
  instagramUrl: "https://instagram.com",
  linkedinUrl: "https://linkedin.com",
  playStoreUrl: "https://play.google.com/store",
  appStoreUrl: "https://apps.apple.com",
  unsubscribeUrl: `${DOMAIN_URL}/unsubscribe`,
  currentYear: new Date().getFullYear().toString(),
};

/**
 * Builds the verification email template payload using nested brand and recipient objects.
 */
export function getEmailOtpVariables({
  code,
  recipient,
  expiresInMinutes = "5",
}: EmailOtpParams): EmailOtpPayload {
  const digits = code.split("");

  return {
    recipient: {
      email: recipient.email || "",
      firstName: recipient.firstName || "Funstaker ",
    },
    brand: BRAND_INFO,
    code: {
      digit1: digits[0] || "",
      digit2: digits[1] || "",
      digit3: digits[2] || "",
      digit4: digits[3] || "",
      digit5: digits[4] || "",
      digit6: digits[5] || "",
    },
    verificationUrl: `${DOMAIN_URL}/verify?code=${code}`,
    expiresInMinutes,
  };
}

/**
 * Builds flattened variable object for direct mapping in Resend templates and fallback renderer.
 */
export function getFlatEmailOtpVariables({
  code,
  recipient,
  expiresInMinutes = "5",
}: EmailOtpParams): FlatEmailOtpVariables {
  const digits = code.split("");

  return {
    email: recipient.email || "",
    firstName: recipient.firstName || "Funstaker ",
    lastName: recipient.lastName || "",
    brandName: BRAND_INFO.brandName || BRAND_NAME,
    supportEmail: BRAND_INFO.supportEmail || SUPPORT_EMAIL,
    logoUrl: BRAND_INFO.logoUrl || LOGO_URL,
    facebookUrl: BRAND_INFO.facebookUrl || "",
    twitterUrl: BRAND_INFO.twitterUrl || "",
    instagramUrl: BRAND_INFO.instagramUrl || "",
    linkedinUrl: BRAND_INFO.linkedinUrl || "",
    playStoreUrl: BRAND_INFO.playStoreUrl || "",
    appStoreUrl: BRAND_INFO.appStoreUrl || "",
    unsubscribeUrl: BRAND_INFO.unsubscribeUrl || "",
    currentYear: BRAND_INFO.currentYear || "2026",
    digit1: digits[0] || "0",
    digit2: digits[1] || "0",
    digit3: digits[2] || "0",
    digit4: digits[3] || "0",
    digit5: digits[4] || "0",
    digit6: digits[5] || "0",
    verificationUrl: `${DOMAIN_URL}/verify?code=${code}`,
    expiresInMinutes,
  };
}
