import mongoose from "mongoose";
import { Response } from "express";
import {
  IAuthRequest,
  getStaticUserList,
  invalidateCache,
  userSensitiveFields,
  userSocialLookup,
  CACHE_KEYS,
} from "@repo/shared";
import { FollowModel, UserModel } from "@repo/database";

export const followUser = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const targetUserId = req.params.id as string;
  const currUserId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(targetUserId) || !currUserId) {
    return res
      .status(400)
      .json({ message: "Invalid ID format", status: "ERROR" });
  }

  if (currUserId === targetUserId) {
    return res
      .status(400)
      .json({ message: "You cannot follow yourself", status: "ERROR" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const followerId = new mongoose.Types.ObjectId(String(currUserId));
    const followingId = new mongoose.Types.ObjectId(String(targetUserId));

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

    // Invalidate caches immediately
    await Promise.all([
      invalidateCache(CACHE_KEYS.USER_PROFILE(currUserId)),
      invalidateCache(CACHE_KEYS.USER_PROFILE(targetUserId)),
    ]);

    // FIX: Pass the required object to getStaticUserList
    const [rawCurrentUser, rawTargetUser] = await Promise.all([
      UserModel.aggregate(
        getStaticUserList({ matchFilter: { _id: followerId }, limit: 1 }),
      ),
      UserModel.aggregate(
        getStaticUserList({ matchFilter: { _id: followingId }, limit: 1 }),
      ),
    ]);

    // Handle potential empty results from aggregate
    const userA = rawCurrentUser[0];
    const userB = rawTargetUser[0];

    // Decorate with social context (isFollowing, followsMe)
    const decoratedUsers = await userSocialLookup(
      [userA, userB],
      String(currUserId),
    );

    // Cleanup sensitive data
    const sensitiveFields = userSensitiveFields();
    const finalPayload = decoratedUsers.map((user: any) => {
      const plainUser = { ...user };
      sensitiveFields.forEach((field) => delete plainUser[field]);
      return plainUser;
    });

    return res.status(200).json({
      message: `User ${action} successfully`,
      status: "SUCCESS",
      payload: {
        currentUser: finalPayload[0],
        targetUser: finalPayload[1],
      },
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    console.error("Follow Action Error:", error);
    return res.status(500).json({
      message: error.message || "An error occurred during the follow action",
      status: "ERROR",
    });
  }
};
