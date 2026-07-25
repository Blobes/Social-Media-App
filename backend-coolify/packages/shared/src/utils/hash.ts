import crypto from "crypto";
import url from "node:url";

export const genVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generates a deterministic SHA-256 hash of the raw input string to normalize multi-byte characters.
 */
export const hashCode = (code: string) => {
  return crypto.createHash("sha256").update(code).digest("hex");
};

/**
 * Normalizes an international string into canonical composed form and strips whitespace.
 */
export const normalizeValue = (value?: string): string => {
  return value?.trim().normalize("NFC") || "";
};

/**
 * Transforms an internationalized username into an ASCII-compatible string using native WHATWG URL APIs.
 */
export const transformToASCII = (normalized: string): string => {
  // const normalized = normalizeValue(value);
  // If the string contains strictly ASCII characters, return it as-is
  if (/^[\x00-\x7F]*$/.test(normalized)) {
    return normalized.toLowerCase();
  }
  // domainToASCII natively handles Unicode scripts and outputs the correct xn-- prefix
  return url.domainToASCII(normalized.toLowerCase());
};

/**
 * Reverses an ASCII-safe Punycode identifier back to its raw display Unicode string.
 */
export const transformToUnicode = (asciiUsername: string): string => {
  return url.domainToUnicode(asciiUsername);
};
