import { Types } from "mongoose";
import {
  UserModel,
  DeviceModel,
  AccountStatusHistoryModel,
  AccountStatus,
  ChangedByType,
} from "@repo/database";
import { TransInfo } from "../../types";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { cleanDeviceSessions } from "../session";
import { CACHE_KEYS, invalidatePattern } from "../../utils/redis/cache";

export interface IStatusSwitchInput {
  targetUserId: string;
  targetStatus: AccountStatus;
  reason?: string | null;
  changedBy?: string | null;
  changedByType: ChangedByType;
  suspensionExpiresAt?: Date | null;
}

export interface IStatusSwitchResult {
  status: "SUCCESS" | "NOT_FOUND" | "NO_OP";
  transInfo?: TransInfo;
}

/**
 * Orchestrates centralized atomic modifications across security profiles and retains strict audit footprints.
 */
export const switchAccountStatus = async (
  input: IStatusSwitchInput,
): Promise<IStatusSwitchResult> => {
  const {
    targetUserId,
    targetStatus,
    reason = null,
    changedBy = null,
    changedByType,
    suspensionExpiresAt = null,
  } = input;

  const userProfile = await UserModel.findById(targetUserId);

  if (!userProfile) {
    return {
      status: "NOT_FOUND",
      ...MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  const previousStatus = userProfile.accountStatus;

  if (previousStatus === targetStatus) {
    return {
      status: "NO_OP",
      ...MESSAGES_REGISTRY.AUTH.ACCOUNT_ALREADY_IN_STATE,
    };
  }

  const updateFields: Record<string, any> = {
    accountStatus: targetStatus,
    statusChangedAt: new Date(),
    statusReason: reason,
    statusChangedBy: changedBy ? new Types.ObjectId(changedBy) : null,
    deactivatedAt: targetStatus === "DEACTIVATED" ? new Date() : null,
  };

  if (targetStatus === "DEACTIVATED" || targetStatus === "BANNED") {
    updateFields.verificationCode = null;
    updateFields.pendingEmail = null;
    updateFields.primaryDeviceId = null;
  }

  await UserModel.findByIdAndUpdate(
    targetUserId,
    { $set: updateFields },
    { new: true },
  );

  await AccountStatusHistoryModel.create({
    account: new Types.ObjectId(targetUserId),
    previousStatus,
    newStatus: targetStatus,
    reason,
    changedBy: changedBy ? new Types.ObjectId(changedBy) : null,
    changedByType,
    suspensionExpiresAt:
      targetStatus === "SUSPENDED" ? suspensionExpiresAt : null,
  });

  if (
    targetStatus === "DEACTIVATED" ||
    targetStatus === "SUSPENDED" ||
    targetStatus === "BANNED"
  ) {
    await DeviceModel.updateMany(
      { userId: targetUserId },
      { $set: { isPrimary: false, isStale: true } },
    );

    await Promise.all([
      cleanDeviceSessions(targetUserId, undefined, { clearAll: true }),
      invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(targetUserId)),
      invalidatePattern(CACHE_KEYS.WILDCARD_USER_SESSIONS(targetUserId)),
    ]);
  } else if (targetStatus === "ACTIVE") {
    await Promise.all([
      invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(targetUserId)),
      invalidatePattern(CACHE_KEYS.WILDCARD_USER_SESSIONS(targetUserId)),
    ]);
  }

  return {
    status: "SUCCESS",
    ...MESSAGES_REGISTRY.AUTH.ACCOUNT_RECORDS_UPDATED,
  };
};
