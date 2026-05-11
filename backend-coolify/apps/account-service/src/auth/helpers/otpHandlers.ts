import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { IUserDocument } from "@repo/database";
import {
  cleanDeviceSessions,
  clearAuthTokens,
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
      `No pending ${channel} change found. Initiate a ${channel} update request first.`,
    ) as any;
    error.status = 400;
    throw error;
  }

  const isAlreadyVerified =
    channel === "EMAIL"
      ? !user.pendingEmail && user.isEmailVerified
      : !user.pendingPhoneNumber && user.isPhoneVerified;

  if (isAlreadyVerified) {
    const error = new Error(
      `This ${channel === "EMAIL" ? "email address" : "phone number"} is already verified.`,
    ) as any;
    error.status = 400;
    throw error;
  }
};

/**
 * Finalizes password update and performs a global session wipe.
 */
export const fulfillPasswordReset = async (
  user: IUserDocument,
  newPassword: string,
  res: Response,
): Promise<any> => {
  if (newPassword.length < 6) {
    const error = new Error(
      "Password must be at least 6 characters long.",
    ) as any;
    error.status = 400;
    throw error;
  }
  if (!newPassword) {
    const error = new Error("New password is required for reset.") as any;
    error.status = 400;
    throw error;
  }
  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  user.lastPasswordVerifiedAt = new Date();

  // Clear all sessions from Redis/DB, including the primary device.
  await cleanDeviceSessions(String(user._id), undefined, {
    clearAll: true,
    preservePrimary: false,
  });
  clearAuthTokens(res);

  // Return specific payload for tracking
  return { loggedOut: true, credentialUpdated: "PASSWORD" };
};

/**
 * Handles user account email or phone verification flag.
 */
export const syncIdentifierStatus = async (
  user: IUserDocument,
  channel: OtpType,
): Promise<any> => {
  if (channel === "EMAIL") {
    user.isEmailVerified = true;
    user.lastEmailCodeSentAt = null;
  } else {
    user.isPhoneVerified = true;
    user.lastPhoneCodeSentAt = null;
  }
  return { channelVerified: channel };
};

/**
 * Promotes a device record to 'trusted' by updating lastVerifiedAt.
 */
export const authorizeDeviceTrust = async (
  user: IUserDocument,
  deviceToken: string,
  req: Request,
): Promise<void> => {
  await upsertDevice(user, deviceToken, req);
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
