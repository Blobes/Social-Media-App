import { IUserDocument } from "@repo/database";
import { OtpType, upsertDevice } from "@repo/shared";
import { Request } from "express";

/**
 * Handles account verification flags.
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
 * Promotes a device record to 'trusted' by updating lastVerifiedAt.
 * This utilizes upsertDevice to handle both new and existing hardware.
 */
export const handleDeviceTrust = async (
  user: IUserDocument,
  deviceToken: string,
  req: Request,
): Promise<void> => {
  // upsertDevice automatically sets lastVerifiedAt = new Date()
  // and checks for primary device logic internally.
  await upsertDevice(user, deviceToken, req);
};

/**
 * Handles identity changes (email/phone updates).
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
