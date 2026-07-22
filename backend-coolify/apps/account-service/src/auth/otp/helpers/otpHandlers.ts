import { IUserDocument } from "@repo/database";
import {
  cleanDeviceSessions,
  MESSAGES_REGISTRY,
  OtpType,
  upsertDevice,
} from "@repo/shared";

/**
 * Validates requirements for identity update codes.
 */
export const guardIdentifierPending = (
  user: IUserDocument,
  channel: OtpType,
): void => {
  const hasPending =
    channel === "EMAIL" ? !!user.pendingEmail : !!user.pendingPhoneNumber;

  if (!hasPending) {
    const error = new Error(
      MESSAGES_REGISTRY.AUTH.NO_PENDING_CHANNEL_CHANGE(channel).message,
    ) as any;
    error.status = 400;
    throw error;
  }
};

/**
 * Finalizes password update and states global session wipe instructions.
 */
export const finalizePasswordReset = async (
  user: IUserDocument,
  channel: OtpType,
): Promise<any> => {
  if (channel === "EMAIL") {
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
  channel: OtpType,
): Promise<any> => {
  if (channel === "EMAIL") {
    user.isEmailVerified = true;
    user.lastEmailOtpSentAt = null;
  } else {
    user.isPhoneVerified = true;
    user.lastPhoneOtpSentAt = null;
  }
  return { channelVerified: channel };
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
  channel: OtpType,
): Promise<any> => {
  let updatedField = null;
  if (channel === "EMAIL" && user.pendingEmail) {
    updatedField = "EMAIL";
    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.isEmailVerified = true;
  } else if (channel === "PHONE" && user.pendingPhoneNumber) {
    updatedField = "PHONE";
    user.phoneNumber = user.pendingPhoneNumber;
    user.pendingPhoneNumber = null;
    user.isPhoneVerified = true;
  }
  return { identityUpdated: updatedField };
};
