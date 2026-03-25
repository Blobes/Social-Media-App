import mongoose, { PipelineStage } from "mongoose";
import { Response } from "express";
import {
  IAuthRequest,
  getUserAggregation,
  invalidateCache,
  userSensitiveFields,
  decorateUserSocial,
} from "@repo/shared";
import { FollowModel, UserModel } from "@repo/database";

export const followUser = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const targetUserId = req.params.id as string;
  const currUserId = req.user?.id;

  // Validate request parameters and authentication state
  if (!mongoose.Types.ObjectId.isValid(targetUserId) || !currUserId) {
    return res
      .status(400)
      .json({ message: "Invalid ID format", status: "ERROR" });
  }

  // Prevent self-following logic
  if (currUserId === targetUserId) {
    return res
      .status(400)
      .json({ message: "You cannot follow yourself", status: "ERROR" });
  }

  // Initialize database session for multi-document transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const followerId = new mongoose.Types.ObjectId(String(currUserId));
    const followingId = new mongoose.Types.ObjectId(String(targetUserId));

    // Check for existing relationship to determine follow vs unfollow action
    const existingFollow = await FollowModel.findOne({
      followerId,
      followingId,
    }).session(session);

    let action: "followed" | "unfollowed";

    if (!existingFollow) {
      // Create follow relationship and increment respective counts
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
      // Remove follow relationship and decrement respective counts
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

    // Persist changes and close session
    await session.commitTransaction();
    session.endSession();

    // Invalidate profile caches to reflect updated counts globally
    await Promise.all([
      invalidateCache(`user:profile:${currUserId}`),
      invalidateCache(`user:profile:${targetUserId}`),
    ]);

    // Fetch updated profiles using neutral aggregation pipeline
    const [rawCurrentUser, rawTargetUser] = await Promise.all([
      UserModel.aggregate([
        { $match: { _id: followerId } },
        ...getUserAggregation(),
      ]),
      UserModel.aggregate([
        { $match: { _id: followingId } },
        ...getUserAggregation(),
      ]),
    ]);

    // Decorate neutral profiles with viewer-specific social context
    const [decoratedCurrentUser, decoratedTargetUser] =
      await decorateUserSocial(
        [rawCurrentUser[0], rawTargetUser[0]],
        currUserId,
      );

    // Remove sensitive fields from payloads before sending response
    const sensitiveFields = userSensitiveFields();
    [decoratedCurrentUser, decoratedTargetUser].forEach((user) => {
      if (user) {
        sensitiveFields.forEach((field) => delete user[field]);
      }
    });

    return res.status(200).json({
      message: `User ${action} successfully`,
      status: "SUCCESS",
      payload: {
        currentUser: decoratedCurrentUser,
        targetUser: decoratedTargetUser,
      },
    });
  } catch (error: any) {
    // Revert all database changes on failure
    await session.abortTransaction();
    session.endSession();

    console.error("Follow Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to process follow action",
      status: "ERROR",
    });
  }
};
