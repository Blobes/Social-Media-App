import mongoose from "mongoose";
import { UserModel } from "@repo/database";
import {
  getUserStaticData,
  userPrivateFields,
  userSensitiveFields,
  getOrSetCache,
  userSocialLookup,
  CACHE_KEYS,
  TransInfo,
  MESSAGES_REGISTRY,
} from "@repo/shared";

interface IGetUserProfileInput {
  targetUserId: string;
  authUserId?: string;
}
interface IGetUserProfileResult {
  status: "SUCCESS" | "NOT_FOUND" | "DEACTIVATED";
  transInfo: TransInfo;
  payload: any;
}

/**
 * Orchestrates cache lookups, database aggregations, relationship styling, and conditional privacy pruning.
 */
export const executeUserProfileFetch = async (
  input: IGetUserProfileInput,
): Promise<IGetUserProfileResult> => {
  const { targetUserId, authUserId } = input;
  const isOwner = authUserId === targetUserId;
  const cacheKey = CACHE_KEYS.USER_PROFILE(targetUserId);

  // Retrieve cached records or execute secondary fallback data pipeline queries
  const baseProfile = await getOrSetCache(
    cacheKey,
    async () => {
      const users = await UserModel.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(String(targetUserId)) },
        },
        ...getUserStaticData(),
      ]);
      return users && users.length > 0 ? users[0] : null;
    },
    1800,
  );

  if (!baseProfile) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      payload: null,
    };
  }
  // Intercept data processing paths early if account parameters mark deactivation
  if (baseProfile.accountStatus === "DEACTIVATED") {
    return {
      status: "DEACTIVATED",
      transInfo: MESSAGES_REGISTRY.PROFILE.ACCOUNT_DEACTIVATED,
      payload: {
        _id: baseProfile._id,
        username: baseProfile.username,
        profileImage: baseProfile.profileImage,
        firstName: baseProfile.firstName,
        lastName: baseProfile.lastName,
        isOwner,
      },
    };
  }
  // Paint following flags using graph relational connections
  const userProfile = await userSocialLookup(
    { ...baseProfile, isOwner },
    authUserId,
  );

  // Enforce zero-trust visibility boundaries
  const sensitiveFields = userSensitiveFields();
  sensitiveFields.forEach((field) => {
    delete userProfile[field];
  });

  if (!isOwner) {
    const privateFields = userPrivateFields();
    privateFields.forEach((field) => {
      delete userProfile[field];
    });
  }
  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.PROFILE.USER_FETCHED_SUCCESSFULLY,
    payload: userProfile,
  };
};
