import { authTokens, FUNSTAKES_REDIS_URL } from "@/envVars";
import { ILocation, IUserDocument, UserModel } from "@repo/database";
import {
  genVerificationCode,
  getLocationFromIp,
  hashCode,
  userSensitiveFields,
  toJwtUser,
  upsertDevice,
  enqueueOtpTask,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";
import { v4 as uuidv4 } from "uuid";
import { executeAccountCheck } from "../../check/service";
import { encryptPass } from "../../helpers/encrypt";
import { signAccessJwt, signRefreshJwt } from "@repo/security";

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
    type: "EMAIL",
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
      type: "PHONE",
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

  const geoData = await getLocationFromIp(ipAddress);
  const location = geoData
    ? ({
        name: `${geoData.city}, ${geoData.state}, ${geoData.country}`,
        city: geoData.city,
        state: geoData.state,
        country: geoData.country,
        type: "Point" as const,
        coordinates: [Number(geoData.longitude), Number(geoData.latitude)],
      } as ILocation)
    : undefined;

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

  await newUser.save();

  const device = await upsertDevice(newUser, deviceToken, userAgent);

  await enqueueOtpTask(
    {
      email: normalizedEmail,
      code,
      type: "EMAIL",
    },
    FUNSTAKES_REDIS_URL,
  );

  const jwtUser = toJwtUser(newUser, device._id.toString(), sessionId);

  const accessToken = signAccessJwt(
    jwtUser,
    sessionId,
    authTokens.ACCESS_TOKEN_SECRET,
  );

  const refreshToken = await signRefreshJwt(
    jwtUser,
    sessionId,
    authTokens.REFRESH_TOKEN_SECRET,
    userAgent,
    ipAddress,
  );

  const safeData = newUser.toJSON();
  userSensitiveFields().forEach((field) => {
    delete (safeData as any)[field];
  });

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.REGISTRATION_SUCCESSFUL,
    safeData,
    accessToken,
    refreshToken,
  };
};
