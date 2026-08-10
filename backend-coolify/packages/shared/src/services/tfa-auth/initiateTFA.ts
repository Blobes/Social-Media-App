import { TransInfo } from "../../types";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { getAccountStatusMsg } from "../../utils/status";
import { authenticatorService } from "./authenticator";
import { fetchSingleUser } from "../user/retrieval/fetchUser";
import { determineCheckType } from "../../utils/sanitizeData";

export type TFAPurpose = "AUTHENTICATE" | "TFA_SETUP";

export interface ITFAInitiationInput {
  purpose: TFAPurpose;
  identifier?: string;
  userId?: string;
}

export interface ITFAInitiationResult {
  status:
    | "SUCCESS"
    | "MISSING_IDENTIFIER"
    | "NOT_FOUND"
    | "RESTRICTION"
    | "INVALID_IDENTIFIER";
  transInfo: TransInfo;
  payload: {
    qrCodeDataUrl: string | null;
    manualEntryKey: string | null;
    isMfaActive: boolean;
  } | null;
}

/**
 * Orchestrates multi-factor authenticator challenges and registration setups based on intent context.
 */
export const executeTFAInitiation = async (
  input: ITFAInitiationInput,
): Promise<ITFAInitiationResult> => {
  const { purpose, identifier, userId } = input;

  if (purpose === "AUTHENTICATE") {
    if (!identifier) {
      return {
        status: "MISSING_IDENTIFIER",
        transInfo: MESSAGES_REGISTRY.AUTH.EMAIL_OR_PHONE_REQUIRED,
        payload: null,
      };
    }

    const isEmail = determineCheckType(identifier) === "EMAIL";
    const isPhone = determineCheckType(identifier) === "PHONE";

    if (!isEmail && !isPhone) {
      return {
        status: "INVALID_IDENTIFIER",
        transInfo: MESSAGES_REGISTRY.AUTH.INVALID_EMAIL_OR_PHONE,
        payload: null,
      };
    }

    const user = await fetchSingleUser({
      identifier,
      flags: {
        lean: true,
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

    const accountStatus = user.accountStatus;
    if (
      accountStatus === "DEACTIVATED" ||
      accountStatus === "SUSPENDED" ||
      accountStatus === "BANNED"
    ) {
      const restrictionMsg = getAccountStatusMsg(accountStatus, "RESTRICTED");
      return {
        status: "RESTRICTION",
        transInfo: restrictionMsg.transInfo,
        payload: null,
      };
    }

    if (!user.twoFactorAuth?.isEnabled || !user.twoFactorAuth?.secret) {
      return {
        status: "RESTRICTION",
        transInfo: MESSAGES_REGISTRY.AUTH.TFA_NOT_ENABLED,
        payload: null,
      };
    }

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.AUTH.TFA_RETRIEVAL_SUCCESS,
      payload: {
        qrCodeDataUrl: null,
        manualEntryKey: null,
        isMfaActive: true,
      },
    };
  }

  if (!userId) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      payload: null,
    };
  }

  const user = await fetchSingleUser({
    identifier: userId,
    flags: { lean: false, skipFilter: true },
  });

  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      payload: null,
    };
  }

  const { secret, qrCodeDataUrl, backupCodes } =
    await authenticatorService.generateSetupPayload(user.email, "Funstakes");

  user.twoFactorAuth.tempSecret = secret;
  user.twoFactorAuth.tempBackupCodes = backupCodes;
  await user.save();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.TFA_SETUP_SUCCESS,
    payload: {
      qrCodeDataUrl,
      manualEntryKey: secret,
      isMfaActive: user.twoFactorAuth?.isEnabled || false,
    },
  };
};
