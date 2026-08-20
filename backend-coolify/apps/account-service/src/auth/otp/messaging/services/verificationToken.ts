import { authTokens } from "@/envVars";
import {
  createDomainError,
  MESSAGES_REGISTRY,
  OtpActionType,
  OtpIdentifierType,
} from "@repo/shared";
import jwt from "jsonwebtoken";

export interface IOtpActionInput {
  userId: string;
  purpose: OtpActionType;
  recipient: string;
  otpIdentifierType: OtpIdentifierType;
}

/**
 * Mints a short-lived signed action token authorizing post-verification operations.
 */
export const signOtpActionToken = (
  payload: IOtpActionInput,
): string => {
  return jwt.sign(
    payload,
    authTokens.ACCESS_TOKEN_SECRET,
    { expiresIn: "10m" },
  );
};

/**
 * Decodes and validates action verification tokens against target intents.
 */
export const verifyOtpActionToken = (
  token: string,
  expectedPurpose: OtpActionType,
): IOtpActionInput => {
  try {
    const decoded = jwt.verify(
      token,
      authTokens.ACCESS_TOKEN_SECRET,
    ) as IOtpActionInput;

    if (decoded.purpose !== expectedPurpose) {
      const transMsg = MESSAGES_REGISTRY.AUTH.INVALID_OTP_VERIFICATION_PURPOSE;
      throw createDomainError(
        transMsg.message,
        transMsg.i18nKey,
        400,
      );
    }

    return decoded;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "statusCode" in err) {
      throw err;
    }

    if (err instanceof jwt.TokenExpiredError) {
      const transMsg = MESSAGES_REGISTRY.AUTH.MISSING_TOKEN;
      throw createDomainError(
        transMsg.message,
        transMsg.i18nKey,
        401,
      );
    }

    const transMsg = MESSAGES_REGISTRY.AUTH.INVALID_TOKEN;
    throw createDomainError(
      transMsg.message,
      transMsg.i18nKey,
      401,
    );
  }
};