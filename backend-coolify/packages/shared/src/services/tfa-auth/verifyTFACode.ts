import { UserModel } from "@repo/database";
import { TransInfo } from "../../types";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { normalizeValue } from "../../utils/hash";
import { authenticatorService } from "./authenticator";
import { TFAPurpose } from "./initiateTFA";
import { fetchSingleUser } from "../user/retrieval/fetchUser";

export interface ITFAVerificationInput {
  purpose: TFAPurpose;
  token: string;
  identifier?: string;
  userId?: string;
}

export interface ITFAVerificationResult {
  status:
    | "SUCCESS"
    | "MISSING_INPUT"
    | "NOT_FOUND"
    | "RESTRICTION"
    | "INVALID_TOKEN";
  transInfo: TransInfo;
  payload: {
    isRecovery?: boolean;
    backupCodes?: string[];
  } | null;
}

/**
 * Validates provided TOTP tokens or backup recovery codes against user configurations based on the requested purpose.
 */
export const executeTFAVerification = async (
  input: ITFAVerificationInput,
): Promise<ITFAVerificationResult> => {
  const { purpose, token, identifier, userId } = input;

  if (!token) {
    return {
      status: "MISSING_INPUT",
      transInfo: MESSAGES_REGISTRY.AUTH.MISSING_TOKEN,
      payload: null,
    };
  }

  if (purpose === "AUTHENTICATE") {
    if (!identifier) {
      return {
        status: "MISSING_INPUT",
        transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_OR_PHONE_REQUIRED,
        payload: null,
      };
    }

    // Normalizing the identifier to ensure consistent database querying matches
    const formattedValue = normalizeValue(identifier);
    const isEmail = formattedValue.includes("@");

    // const user = isEmail
    //   ? await UserModel.findByEmail({
    //       email: formattedValue.toLowerCase(),
    //       options: {
    //         skipFilter: true,
    //       },
    //     })
    //   : await UserModel.findByPhone({
    //       phoneNumber: formattedValue.replace(/\D/g, ""),
    //       options: {
    //         skipFilter: true,
    //       },
    //     });

    const user = await fetchSingleUser({
      identifier: isEmail
        ? formattedValue.toLowerCase()
        : formattedValue.replace(/\D/g, ""),
      flags: {
        lean: false,
        identifierType: isEmail ? "EMAIL" : "PHONE",
        skipFilter: true,
      },
    });

    if (!user) {
      return {
        status: "NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
        payload: null,
      };
    }

    // Checking if the target authentication profile is properly configured to execute context verification
    if (!user.twoFactorAuth?.isEnabled || !user.twoFactorAuth?.secret) {
      return {
        status: "RESTRICTION",
        transInfo: MESSAGES_REGISTRY.AUTH.TFA_NOT_ENABLED,
        payload: null,
      };
    }

    // Checking backup codes first in case access to the authenticator device is lost
    const backupCodes = user.twoFactorAuth.backupCodes || [];
    const normalizedToken = token.toUpperCase();
    const matchingBackupIndex = backupCodes.indexOf(normalizedToken);

    if (matchingBackupIndex !== -1) {
      // Revoking the used code immediately to prevent replay attacks and re-use vectors
      backupCodes.splice(matchingBackupIndex, 1);
      user.twoFactorAuth.backupCodes = backupCodes;
      await user.save();

      return {
        status: "SUCCESS",
        transInfo: MESSAGES_REGISTRY.AUTH.TFA_RECOVERY_SUCCESS,
        payload: { isRecovery: true },
      };
    }

    // Falling back to live cryptographic checking windows for standard TOTP verification
    const isValid = authenticatorService.verifyToken(
      token,
      user.twoFactorAuth.secret,
    );

    if (!isValid) {
      return {
        status: "INVALID_TOKEN",
        transInfo: MESSAGES_REGISTRY.AUTH.INVALID_TOKEN,
        payload: null,
      };
    }

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.AUTH.TFA_VERIFICATION_SUCCESS,
      payload: { isRecovery: false },
    };
  }

  // Handling the TFA registration and finalization setup flow
  if (!userId) {
    return {
      status: "MISSING_INPUT",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      payload: null,
    };
  }

  const user = await fetchSingleUser({
    identifier: userId,
    flags: { lean: false, skipFilter: true },
  });

  // const user = await UserModel.findById(userId);

  if (!user || !user.twoFactorAuth.tempSecret) {
    return {
      status: "RESTRICTION",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_LIFECYCLE_SEQUENCE,
      payload: null,
    };
  }

  // Validating token against the transient secret generated during the initiation phase
  const isValid = authenticatorService.verifyToken(
    token,
    user.twoFactorAuth.tempSecret,
  );

  if (!isValid) {
    return {
      status: "INVALID_TOKEN",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_TOKEN,
      payload: null,
    };
  }

  // Committing transient metrics into definitive active security parameters
  user.twoFactorAuth = {
    ...user.twoFactorAuth,
    isEnabled: true,
    secret: user.twoFactorAuth.tempSecret,
    backupCodes: user.twoFactorAuth.tempBackupCodes || [],
  };

  const backupCodesToReturn = user.twoFactorAuth.tempBackupCodes || [];

  // Nullifying transient fields to secure the registration state
  user.twoFactorAuth.tempSecret = null;
  user.twoFactorAuth.tempBackupCodes = [];

  await user.save();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.TFA_SETUP_FINALIZED,
    payload: {
      backupCodes: backupCodesToReturn,
    },
  };
};
