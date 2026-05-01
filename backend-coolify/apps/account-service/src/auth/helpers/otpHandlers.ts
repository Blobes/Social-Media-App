import { IUserDocument } from "@repo/database";
import { finalizeDeviceTrust, OtpType } from "@repo/shared";

/**
 * Handles account verification during onboarding or login.
 */
export const handleChannelVerification = async (
  user: IUserDocument,
  channel: OtpType,
): Promise<void> => {
  if (channel === "EMAIL") {
    user.isEmailVerified = true;
    user.lastEmailCodeSentAt = null;
  } else {
    user.isPhoneVerified = true;
    user.lastPhoneCodeSentAt = null;
  }
};

/**
 * Handles promoting a device to the trust registry.
 */
export const handleDeviceTrust = async (
  user: IUserDocument,
  deviceId: string,
): Promise<void> => {
  await finalizeDeviceTrust(user, deviceId);
};

/**
 * Handles account update updates (email/phone changes).
 */
export const handleAccountUpdate = async (
  user: IUserDocument,
  channel: OtpType,
): Promise<void> => {
  if (channel === "EMAIL" && user.pendingEmail) {
    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.isEmailVerified = true;
  } else if (channel === "PHONE" && user.pendingPhoneNumber) {
    user.phoneNumber = user.pendingPhoneNumber;
    user.pendingPhoneNumber = null;
    user.isPhoneVerified = true;
  }
};
