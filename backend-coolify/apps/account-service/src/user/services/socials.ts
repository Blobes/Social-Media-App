import mongoose from "mongoose";
import { FollowModel, UserModel } from "@repo/database";
import {
  getStaticUserList,
  invalidateCache,
  userSensitiveFields,
  userSocialLookup,
  CACHE_KEYS,
  TransInfo,
  MESSAGES_REGISTRY,
  getOrSetCache,
} from "@repo/shared";

interface IFollowUserInput {
  currUserId: string;
  targetUserId: string;
}

interface IFollowUserResult {
  status: "SUCCESS" | "NOT_FOUND";
  transInfo: TransInfo;
  payload?: {
    currentUser: any;
    targetUser: any;
  };
}

/**
 * Toggles a follow relationship between users inside an atomic transaction, flushing profile caches.
 */
export const toggleUserFollow = async (
  input: IFollowUserInput,
): Promise<IFollowUserResult> => {
  const { currUserId, targetUserId } = input;

  const followerId = new mongoose.Types.ObjectId(String(currUserId));
  const followingId = new mongoose.Types.ObjectId(String(targetUserId));

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingFollow = await FollowModel.findOne({
      followerId,
      followingId,
    }).session(session);

    let action: "followed" | "unfollowed";

    if (!existingFollow) {
      await FollowModel.create([{ followerId, followingId }], { session });
      await UserModel.findByIdAndUpdate(
        followerId,
        { $inc: { followingCount: 1 } },
        { session },
      );
      await UserModel.findByIdAndUpdate(
        followingId,
        { $inc: { followersCount: 1 } },
        { session },
      );
      action = "followed";
    } else {
      await FollowModel.deleteOne({ _id: existingFollow._id }).session(session);
      await UserModel.findByIdAndUpdate(
        followerId,
        { $inc: { followingCount: -1 } },
        { session },
      );
      await UserModel.findByIdAndUpdate(
        followingId,
        { $inc: { followersCount: -1 } },
        { session },
      );
      action = "unfollowed";
    }

    await session.commitTransaction();
    session.endSession();

    // Evict cached data vectors across matching profile entities
    await Promise.all([
      invalidateCache(CACHE_KEYS.USER_PROFILE(currUserId)),
      invalidateCache(CACHE_KEYS.USER_PROFILE(targetUserId)),
    ]);

    // Pull refreshed records via normalized static lists aggregation pipelines
    const [rawCurrentUser, rawTargetUser] = await Promise.all([
      UserModel.aggregate(
        getStaticUserList({ matchFilter: { _id: followerId }, limit: 1 }),
      ),
      UserModel.aggregate(
        getStaticUserList({ matchFilter: { _id: followingId }, limit: 1 }),
      ),
    ]);

    const userA = rawCurrentUser[0];
    const userB = rawTargetUser[0];

    if (!userA || !userB) {
      return {
        status: "NOT_FOUND",
        transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      };
    }

    // Paint graph structural state values onto response objects
    const decoratedUsers = await userSocialLookup(
      [userA, userB],
      String(currUserId),
    );

    const sensitiveFields = userSensitiveFields();
    const finalPayload = decoratedUsers.map((user: any) => {
      const plainUser = { ...user };
      sensitiveFields.forEach((field) => delete plainUser[field]);
      return plainUser;
    });

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.PROFILE.FOLLOW_TOGGLE_SUCCESS(action),
      payload: {
        currentUser: finalPayload[0],
        targetUser: finalPayload[1],
      },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

interface IGetFollowersInput {
  targetUserId: string;
  authUserId?: string;
  page: number;
  limit: number;
}

interface IGetFollowersResult {
  status: "SUCCESS";
  transInfo: TransInfo;
  payload: any[];
}

/**
 * Orchestrates cached pipeline lookups for follower records and decorates viewer-dependent graph metadata.
 */
export const executeFollowersFetch = async (
  input: IGetFollowersInput,
): Promise<IGetFollowersResult> => {
  const { targetUserId, authUserId, page, limit } = input;
  const skip = (page - 1) * limit;

  // Use a generic cache key to maximize hit rate across all visitors
  const cacheKey = CACHE_KEYS.USER_FOLLOWERS(targetUserId, page, limit);

  // Fetch the neutral list from cache or MongoDB aggregation pipeline
  const neutralFollowers = await getOrSetCache(
    cacheKey,
    async () => {
      const result = await FollowModel.aggregate([
        {
          $match: {
            followingId: new mongoose.Types.ObjectId(String(targetUserId)),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "followerId",
            foreignField: "_id",
            as: "followerDetails",
          },
        },
        { $unwind: "$followerDetails" },
        { $replaceRoot: { newRoot: "$followerDetails" } },

        // Apply standardized formatting and generic aggregation
        ...getStaticUserList({
          matchFilter: {},
          skip,
          limit,
        }),
      ]);
      return result;
    },
    600, // Cache for 10 minutes
  );

  // Decorate the list with the current viewer's social context
  const finalFollowers = await userSocialLookup(neutralFollowers, authUserId);

  const hasFollowers = finalFollowers.length > 0;

  return {
    status: "SUCCESS",
    transInfo: hasFollowers
      ? MESSAGES_REGISTRY.PROFILE.FOLLOWERS_FETCH_SUCCESS
      : MESSAGES_REGISTRY.PROFILE.NO_FOLLOWER_FOUND,
    payload: finalFollowers,
  };
};
