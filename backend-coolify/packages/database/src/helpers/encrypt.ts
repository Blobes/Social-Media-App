import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

let cachedKeyBuffer: Buffer | null = null;

/**
 * Resolves and validates the encryption key buffer on demand.
 */
const getEncryptionKeyBuffer = (): Buffer => {
  if (cachedKeyBuffer) {
    return cachedKeyBuffer;
  }
  const encryptionKey = process.env.DB_ENCRYPTION_KEY || "";
  const keyBuffer = Buffer.from(encryptionKey, "hex");

  if (keyBuffer.length !== 32) {
    throw new Error(
      `Encryption key must be exactly 32 bytes long. Current byte length: ${keyBuffer.length}`,
    );
  }
  cachedKeyBuffer = keyBuffer;
  return cachedKeyBuffer;
};

/**
 * Encrypts a plaintext string into a unified iv:tag:ciphertext string representation.
 */
export const encrypt = (value: string): string => {
  if (!value) return value;

  const keyBuffer = getEncryptionKeyBuffer();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

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

  const keyBuffer = getEncryptionKeyBuffer();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encryptedTextBuffer = Buffer.from(ciphertextHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedTextBuffer, undefined, "utf8");
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

/**
 * Computes a blind tracking index signature for a value using a secure keyed HMAC.
 */
export const hashLookup = (value: string): string => {
  if (!value) return value;

  const lookupHashKey = process.env.DB_HASH_KEY || "";
  if (!lookupHashKey) {
    throw new Error("Lookup hash key configuration is missing.");
  }
  const normalized = value.toLowerCase().trim();
  return crypto
    .createHmac("sha256", lookupHashKey)
    .update(normalized)
    .digest("hex");
};
