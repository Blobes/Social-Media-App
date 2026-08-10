import { IUserDocument } from "@repo/database";
import { IJwtUser, InputCheckType } from "../types";

export const userSensitiveFields = (): string[] => {
  return [
    "password",
    "emailHash",
    "phoneNumberHash",
    "otpCode",
    "otpCodeExpiresAt",
    "lastEmailOtpSentAt",
    "lastPhoneOtpSentAt",
    "__v",
  ];
};

export const userPrivateFields = (): string[] => {
  return [
    "email",
    "phoneNumber",
    "onboardingStep",
    "dateOfBirth",
    "pendingEmail",
    "lastEmailChangeAt",
    "isEmailVerified",
    "isPhoneVerified",
    "accountStatus",
    "location", // Optional: hide if you want to keep exact location private
  ];
};

/**
 * Strips sensitive identity and security attributes from user record payloads.
 */
export const sanitizeUserResult = <T>(userData: T, fields: string[]): T => {
  if (!userData || typeof userData !== "object") return userData;
  const sensitiveKeys = new Set(fields);
  const sanitizeObject = (
    obj: Record<string, unknown>,
  ): Record<string, unknown> => {
    const cleaned = { ...obj };
    sensitiveKeys.forEach((key) => {
      delete cleaned[key];
    });
    return cleaned;
  };
  if (Array.isArray(userData)) {
    return userData.map((item) =>
      typeof item === "object" && item !== null
        ? sanitizeObject(item as Record<string, unknown>)
        : item,
    ) as unknown as T;
  }
  return sanitizeObject(userData as Record<string, unknown>) as unknown as T;
};

/**
 * Transforms a User document and session metadata into a standard JWT payload.
 */
export const toJwtUser = (
  user: IUserDocument,
  deviceId: string,
  sessionId: string,
): IJwtUser => {
  return {
    id: user._id.toString(),
    deviceId,
    sessionId,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
  };
};

/**
 * Resolves the verification input check-type based on input text structure.
 */
export const determineCheckType = (identifier: string): InputCheckType => {
  if (identifier.includes("@")) return "EMAIL";
  if (/^\+?\d+$/.test(identifier.replace(/\s+/g, ""))) return "PHONE";
  return "USERNAME";
};
