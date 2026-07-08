import { hashCode } from "@repo/shared";
import bcrypt from "bcrypt";

/**
 * Safely hashes any international or non-Latin strings layout without truncation risks.
 */
export const encryptPass = async (passValue: string): Promise<string> => {
  const normalizedPass = hashCode(passValue);
  // Normalized input is a 64-character hex string, well within bcrypt's 72-byte limit
  const saltRounds = 12;
  return await bcrypt.hash(normalizedPass, saltRounds);
};

/**
 * Verifies a raw incoming password against a stored secure hash.
 */
export const verifyEncryptedPass = async (
  passValue: string,
  storedHash: string,
): Promise<boolean> => {
  const normalizedPass = hashCode(passValue);
  return await bcrypt.compare(normalizedPass, storedHash);
};
