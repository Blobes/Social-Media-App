import { IUserDocument } from "@repo/database";
import {
  cleanDeviceSessions,
  MESSAGES_REGISTRY,
  OtpIdentifierType,
  upsertDevice,
} from "@repo/shared";

/**
 * Validates requirements for identity update codes.
 */
export const guardIdentifierPending = (
  user: IUserDocument,
  otpIdentifierType?: OtpIdentifierType,
): void => {
  const hasPending =
    otpIdentifierType === "EMAIL"
      ? !!user.pendingEmail
      : !!user.pendingPhoneNumber;

  if (!hasPending) {
    const transMsg = MESSAGES_REGISTRY.AUTH.NO_PENDING_CHANNEL_CHANGE(
      otpIdentifierType || "Identifier",
    );
    const error = new Error(transMsg.message) as any;
    error.status = 400;
    error.i18nKey = transMsg.i18nKey;
    error.interpolations = transMsg.interpolations;
    throw error;
  }
};

/**
 * Finalizes password update and states global session wipe instructions.
 */
export const finalizePasswordReset = async (
  user: IUserDocument,
  recipientType?: OtpIdentifierType,
): Promise<any> => {
  if (recipientType === "EMAIL") {
    user.isEmailVerified = true;
    user.lastEmailOtpSentAt = null;
  } else {
    user.isPhoneVerified = true;
    user.lastPhoneOtpSentAt = null;
  }

  await cleanDeviceSessions(String(user._id), undefined, {
    clearAll: true,
    preservePrimary: false,
  });
  return {
    loggedOut: true,
    clearLocalCookies: true,
    credentialUpdated: "PASSWORD",
  };
};

/**
 * Handles user account email or phone verification flag updates.
 */
export const syncIdentifierStatus = async (
  user: IUserDocument,
  recipientType?: OtpIdentifierType,
): Promise<any> => {
  if (recipientType === "EMAIL") {
    user.isEmailVerified = true;
    user.lastEmailOtpSentAt = null;
  } else {
    user.isPhoneVerified = true;
    user.lastPhoneOtpSentAt = null;
  }
  return { channelVerified: recipientType };
};

/**
 * Promotes a device record to 'trusted' by updating lastVerifiedAt markers.
 */
export const authorizeDeviceTrust = async (
  user: IUserDocument,
  deviceToken: string,
  userAgent: string,
): Promise<void> => {
  await upsertDevice(user, deviceToken, userAgent);
};

/**
 * Handles identity changes (email/phone updates).
 */
export const commitIdentifierChange = async (
  user: IUserDocument,
  recipientType?: OtpIdentifierType,
): Promise<any> => {
  let updatedField = null;
  if (recipientType === "EMAIL" && user.pendingEmail) {
    updatedField = "EMAIL";
    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.isEmailVerified = true;
  } else if (user.pendingPhoneNumber) {
    updatedField = "PHONE_NUMBER";
    user.phoneNumber = user.pendingPhoneNumber;
    user.pendingPhoneNumber = null;
    user.isPhoneVerified = true;
  }
  return { identityUpdated: updatedField };
};
