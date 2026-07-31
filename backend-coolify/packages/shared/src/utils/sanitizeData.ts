import { IUserDocument } from "@repo/database";
import { IJwtUser } from "../types";

export const userSensitiveFields = (): string[] => {
  return [
    "password",
    "emailHash",
    "phoneNumberHash",
    "otpCode",
    "otpCodeExpiresAt",
    "lastEmailOtpSentAt",
    "lastPhoneOtpSentAt",
    "deactivatedAt",
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
