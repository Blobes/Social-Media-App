import mongoose from "mongoose";
import { UserModel } from "@repo/database";
import {
  getUserStaticData,
  userPrivateFields,
  userSensitiveFields,
  getOrSetCache,
  userSocialLookup,
  CACHE_KEYS,
  invalidateCache,
  evaluateNotability,
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
interface IUpdateBasicInfoInput {
  authUserId: string;
  firstName?: string;
  lastName?: string;
  about?: string;
  interests?: string[];
  website?: string;
  occupation?: string;
}
interface IUpdateBasicInfoResult {
  status: "SUCCESS" | "NOT_FOUND";
  transInfo: TransInfo;
  payload?: any;
  requiresIdVerification?: boolean;
}
interface IUpdateDemoInfoInput {
  authUserId: string;
  gender?: string;
  dateOfBirth?: string;
  location?: string;
  relationship?: string;
}
interface IUpdateDemoInfoResult {
  status: "SUCCESS" | "NOT_FOUND";
  transInfo: TransInfo;
  payload?: any;
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
  if (baseProfile.isDeactivated) {
    return {
      status: "DEACTIVATED",
      transInfo: MESSAGES_REGISTRY.PROFILE.ACCOUNT_DEACTIVATED,
      payload: {
        _id: baseProfile._id,
        username: baseProfile.username,
        profileImage: baseProfile.profileImage,
        firstName: baseProfile.firstName,
        lastName: baseProfile.lastName,
        isDeactivated: true,
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

/**
 * Recalculates platform notability settings upon identity changes and stores profile mutations.
 */
export const updateAccountBasicInfo = async (
  input: IUpdateBasicInfoInput,
): Promise<IUpdateBasicInfoResult> => {
  const {
    authUserId,
    firstName,
    lastName,
    about,
    interests,
    website,
    occupation,
  } = input;

  const user = await UserModel.findById(authUserId);
  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  // Recalculate background profiling parameters if structural identity metrics mutate
  let isVIPCandidate = false;

  const isFirstNameChanged =
    firstName !== undefined && firstName !== user.firstName;
  const isLastNameChanged =
    lastName !== undefined && lastName !== user.lastName;

  if (isFirstNameChanged || isLastNameChanged) {
    const updatedFirstName = firstName || user.firstName;
    const updatedLastName = lastName || user.lastName;
    const fullName = `${updatedFirstName} ${updatedLastName}`;

    const notability = await evaluateNotability(
      fullName,
      user.email,
      user.phoneNumber || undefined,
    );
    isVIPCandidate = notability.isVIPCandidate;

    user.meritsVerification = notability.isVIPCandidate;
    user.isNotable = notability.isVIPCandidate;
    user.verificationSignals = {
      hasWikipedia: notability.signals.notableName,
      isVipEmail: notability.signals.proEmail,
      isVipPhone: notability.signals.validPhone,
    };
  }

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (about !== undefined) user.about = about;
  if (interests !== undefined) user.interests = interests;
  if (website !== undefined) user.website = website;
  if (occupation !== undefined) user.occupation = occupation;

  await user.save();

  // Flush stale storage blocks before compiling response sets
  await invalidateCache(CACHE_KEYS.USER_PROFILE(authUserId));

  const safePayload = user.toObject();
  userSensitiveFields().forEach((field) => {
    delete (safePayload as any)[field];
  });

  return {
    status: "SUCCESS",
    transInfo:
      MESSAGES_REGISTRY.PROFILE.USER_BASIC_DETAILS_UPDATED_SUCCESSFULLY,
    payload: safePayload,
    requiresIdVerification: isVIPCandidate,
  };
};

/**
 * Persists user demographic modifications, evicts runtime profile caches, and sanitizes outgoing documents.
 */
export const updateAccountDemoInfo = async (
  input: IUpdateDemoInfoInput,
): Promise<IUpdateDemoInfoResult> => {
  const { authUserId, gender, dateOfBirth, location, relationship } = input;

  const updatedUser = await UserModel.findByIdAndUpdate(
    authUserId,
    {
      $set: {
        gender,
        dateOfBirth,
        location,
        relationship,
      },
    },
    { new: true, runValidators: true },
  );

  if (!updatedUser) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }
  // Clear stale profiling cache values immediately to keep client layers accurate
  await invalidateCache(CACHE_KEYS.USER_PROFILE(authUserId));

  const safePayload = updatedUser.toObject();
  userSensitiveFields().forEach((field) => {
    delete (safePayload as any)[field];
  });
  return {
    status: "SUCCESS",
    transInfo:
      MESSAGES_REGISTRY.PROFILE.DEMOGRAPHIC_INFORMATION_UPDATED_SUCCESSFULLY,
    payload: safePayload,
  };
};
