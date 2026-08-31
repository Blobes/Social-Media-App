import { authTokens, FUNSTAKES_REDIS_URL } from "@/envVars";
import { IUserDocument, UserModel } from "@repo/database";
import {
  genVerificationCode,
  hashCode,
  userSensitiveFields,
  upsertDevice,
  enqueueOtpTask,
  MESSAGES_REGISTRY,
  TransInfo,
  sanitizeUserResult,
  buildLocationFromIp,
} from "@repo/shared";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { executeAccountCheck } from "../../check/service";
import { encryptPass } from "../../helpers/encrypt";
import { issueAuthTokens } from "@repo/security";
import { syncDefaultRole } from "../../helpers/syncRole";

interface IRegistrationInput {
  email: string;
  password: string;
  phone?: string;
  deviceToken: string;
  ipAddress: string;
  userAgent: string;
}

interface IRegistrationResult {
  status: "SUCCESS" | "DEACTIVATED";
  transInfo?: TransInfo;
  userId?: string;
  safeData?: any;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Handles the core business logic pipeline for user account registration.
 */
export const registerUserAccount = async (
  input: IRegistrationInput,
): Promise<IRegistrationResult> => {
  const { email, password, phone, deviceToken, ipAddress, userAgent } = input;
  const normalizedEmail = email.toLowerCase().trim();

  // Validate email availability and security state using unified service check layer
  const emailCheckResult = await executeAccountCheck({
    identifierType: "EMAIL",
    identifier: normalizedEmail,
    purpose: "REGISTRATION",
  });

  if (emailCheckResult.isExisting) {
    if (emailCheckResult.payload?.accountStatus === "DEACTIVATED") {
      return {
        status: "DEACTIVATED",
        transInfo: MESSAGES_REGISTRY.AUTH.ACCOUNT_DEACTIVATED,
        userId: emailCheckResult.payload.userId.toString(),
      };
    }
    throw new Error("CONFLICT_EMAIL_IN_USE");
  }

  // Validate phone number availability if provided during flow step
  if (phone) {
    const phoneCheckResult = await executeAccountCheck({
      identifierType: "PHONE_NUMBER",
      identifier: phone,
      purpose: "REGISTRATION",
    });
    if (phoneCheckResult.isExisting) {
      throw new Error("CONFLICT_PHONE_IN_USE");
    }
  }

  const hashedPassword = await encryptPass(password);
  const code = genVerificationCode();
  const sessionId = uuidv4();

  const location = await buildLocationFromIp(ipAddress);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newUser: IUserDocument = new UserModel({
      email: normalizedEmail,
      password: hashedPassword,
      phoneNumber: phone,
      location,
      otpCode: hashCode(code),
      otpCodeExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      lastEmailOtpSentAt: new Date(),
      signedUpWith: "EMAIL",
    });

    await newUser.save({ session });

    // Provision default role and baseline subscription tier directly
    await syncDefaultRole(newUser._id, { session, skipCheck: true });

    const device = await upsertDevice(newUser, deviceToken, userAgent, session);

    await session.commitTransaction();

    await enqueueOtpTask(
      {
        email: normalizedEmail,
        code,
        type: "EMAIL",
      },
      FUNSTAKES_REDIS_URL,
    );

    const { accessToken, refreshToken } = await issueAuthTokens({
      user: newUser,
      deviceId: device._id.toString(),
      sessionId,
      userAgent,
      ipAddress,
      authTokens,
    });

    const safeData = sanitizeUserResult(newUser, userSensitiveFields());

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.AUTH.REGISTRATION_SUCCESSFUL,
      safeData,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
