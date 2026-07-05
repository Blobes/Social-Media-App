import { UserModel, DeviceModel } from "@repo/database";
import {
  CACHE_KEYS,
  invalidatePattern,
  cleanDeviceSessions,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";

interface IDeactivationInput {
  finalIdToProcess: string;
}
interface IDeactivationResult {
  status: "SUCCESS" | "NOT_FOUND" | "ALREADY_DEACTIVATED";
  transInfo?: TransInfo;
}

/**
 * Executes a soft delete on a user profile and destroys all hardware and session contexts.
 */
export const executeAccountDeactivation = async (
  input: IDeactivationInput,
): Promise<IDeactivationResult> => {
  const { finalIdToProcess } = input;

  const userToExclude = await UserModel.findById(finalIdToProcess);

  if (!userToExclude) {
    return {
      status: "NOT_FOUND",
      ...MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  if (userToExclude.isDeactivated) {
    return {
      status: "ALREADY_DEACTIVATED",
      ...MESSAGES_REGISTRY.AUTH.ACCOUNT_ALREADY_DEACTIVATED,
    };
  }

  // Persist updated safety states across records
  await UserModel.findByIdAndUpdate(
    finalIdToProcess,
    {
      $set: {
        isDeactivated: true,
        deactivatedAt: new Date(),
        accountStatus: "DEACTIVATED",
        verificationCode: null,
        pendingEmail: null,
        primaryDeviceId: null,
      },
    },
    { new: true },
  );

  // Clear device linking registers
  await DeviceModel.updateMany(
    { userId: finalIdToProcess },
    { $set: { isPrimary: false, isStale: true } },
  );

  // Wipe cache references and connection layers simultaneously
  await Promise.all([
    cleanDeviceSessions(finalIdToProcess, undefined, { clearAll: true }),
    invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(finalIdToProcess)),
    invalidatePattern(CACHE_KEYS.WILDCARD_USER_SESSIONS(finalIdToProcess)),
  ]);

  return {
    status: "SUCCESS",
    ...MESSAGES_REGISTRY.AUTH.ACCOUNT_RECORDS_CLEARED,
  };
};
