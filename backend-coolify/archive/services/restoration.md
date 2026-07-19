import { DeactivatedAccountModel, UserModel } from "@repo/database";
import {
  userSensitiveFields,
  CACHE_KEYS,
  invalidateCache,
  upsertDevice,
  TransInfo,
  MESSAGES_REGISTRY,
} from "@repo/shared";

interface IRestorationInput {
  authUserId: string;
  deviceToken?: string;
  userAgent: string;
}

interface IRestorationResult {
  status: "SUCCESS" | "NOT_FOUND";
  transInfo: TransInfo;
  payload?: any;
}

/**
 * Restores a soft-deleted user account profile and registers the device context.
 */
export const executeAccountRestoration = async (
  input: IRestorationInput,
): Promise<IRestorationResult> => {
  const { authUserId, deviceToken, userAgent } = input;

  const user = await UserModel.findOne({
    _id: authUserId,
    accountStatus: "DEACTIVATED",
  }).setOptions({ skipFilter: true });

  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.DEACTIVATED_NOT_FOUND,
    };
  }

  // Reset profile tracking and historical deactivation markers
  user.deactivatedAt = null as any;
  user.accountStatus = "ACTIVE";
  await user.save();

  // Purge tracking state log completely upon profile reversal
  await DeactivatedAccountModel.deleteOne({ userId: authUserId });

  // Re-establish hardware trust parameters if matching device context is present
  if (deviceToken) {
    await upsertDevice(user, deviceToken, userAgent);
  }

  // Clear stale authorization memory caches
  await invalidateCache(CACHE_KEYS.USER_PROFILE(authUserId));

  // Sanitize data properties against disclosure policies
  const safeData = user.toObject();
  userSensitiveFields().forEach((field) => {
    delete (safeData as any)[field];
  });

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.WELCOME_BACK_ACCOUNT_RESTORED,
    payload: safeData,
  };
};
