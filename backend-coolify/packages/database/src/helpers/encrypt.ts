import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Encrypts a plaintext string into a unified iv:tag:ciphertext string representation.
 */
export const encrypt = (value: string): string => {
  if (!value) return value;

  // Validate key constraints for required algorithm standard
  if (Buffer.byteLength(ENCRYPTION_KEY, "utf8") !== 32) {
    throw new Error("Encryption key must be exactly 32 bytes long.");
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    iv,
  );

  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${tag}:${encrypted}`;
};

/**
 * Decrypts a unified iv:tag:ciphertext compound string back into raw plaintext.
 */
export const decrypt = (value: string): string => {
  if (!value) return value;

  const parts = value.split(":");
  if (parts.length !== 3) {
    return value;
  }

  const [ivHex, tagHex, ciphertextHex] = parts;

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encryptedText = Buffer.from(ciphertextHex, "hex");

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    iv,
  );
  decipher.setAuthTag(tag);

  let decrypted = decipher.toString();
  decrypted += decipher.final("utf8");

  return decrypted;
};

/**
 * Validates if a target value matches the internal storage serialization pattern.
 */
export const isEncryptedPattern = (value: string): boolean => {
  if (typeof value !== "string") return false;
  const parts = value.split(":");
  return (
    parts.length === 3 &&
    parts[0].length === IV_LENGTH * 2 &&
    parts[1].length === TAG_LENGTH * 2
  );
};

const LOOKUP_HASH_KEY = process.env.LOOKUP_HASH_KEY || "";

/**
 * Computes a blind tracking index signature for a value using a secure keyed HMAC.
 */
export const hashLookup = (value: string): string => {
  if (!value) return value;

  if (!LOOKUP_HASH_KEY) {
    throw new Error("Lookup hash key configuration is missing.");
  }

  const normalized = value.toLowerCase().trim();

  return crypto
    .createHmac("sha256", LOOKUP_HASH_KEY)
    .update(normalized)
    .digest("hex");
};
