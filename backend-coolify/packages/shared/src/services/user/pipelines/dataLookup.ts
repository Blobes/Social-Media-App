import mongoose from "mongoose";
import { FollowModel } from "@repo/database";

export interface SocialLookupUser {
  _id: string | mongoose.Types.ObjectId;
  [key: string]: unknown;
}

export type EnrichedSocialUser<T extends SocialLookupUser> = T & {
  isFollowing: boolean;
  followsMe: boolean;
};

/**
 * Enriches user record objects with social relationship indicators relative to a viewer.
 */
export const userSocialLookup = async <
  T extends SocialLookupUser | SocialLookupUser[],
>(
  users: T,
  viewerId?: string | mongoose.Types.ObjectId,
): Promise<
  T extends Array<infer U extends SocialLookupUser>
    ? EnrichedSocialUser<U>[]
    : T extends SocialLookupUser
      ? EnrichedSocialUser<T>
      : never
> => {
  if (!viewerId || !users) {
    const defaultTransform = (
      item: SocialLookupUser,
    ): EnrichedSocialUser<SocialLookupUser> => ({
      ...item,
      isFollowing: false,
      followsMe: false,
    });

    return (
      Array.isArray(users)
        ? users.map(defaultTransform)
        : defaultTransform(users as SocialLookupUser)
    ) as never;
  }

  const isInputArray = Array.isArray(users);
  const userList: SocialLookupUser[] = isInputArray
    ? (users as SocialLookupUser[])
    : [users as SocialLookupUser];

  if (userList.length === 0) {
    return (isInputArray ? [] : {}) as never;
  }

  const targetUserIds = userList.map((user) => user._id);
  const normalizedViewerId = new mongoose.Types.ObjectId(String(viewerId));

  const [followingDocs, followerDocs] = await Promise.all([
    FollowModel.find({
      followerId: normalizedViewerId,
      followingId: { $in: targetUserIds },
    })
      .select("followingId")
      .lean(),

    FollowModel.find({
      followerId: { $in: targetUserIds },
      followingId: normalizedViewerId,
    })
      .select("followerId")
      .lean(),
  ]);

  const followingSet = new Set(
    followingDocs.map((doc) => String(doc.followingId)),
  );
  const followersSet = new Set(
    followerDocs.map((doc) => String(doc.followerId)),
  );

  const decoratedUsers = userList.map((user) => ({
    ...user,
    isFollowing: followingSet.has(String(user._id)),
    followsMe: followersSet.has(String(user._id)),
  }));

  return (isInputArray ? decoratedUsers : decoratedUsers[0]) as never;
};
