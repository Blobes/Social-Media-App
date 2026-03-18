import mongoose, { PipelineStage } from "mongoose";
import { Response } from "express";
import { IAuthRequest, getUserAggregation } from "@repo/shared";
import { FollowModel, UserModel } from "@repo/database";

export const followUser = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const targetUserId = req.params.id as string;
  const currUserId = req.user?.id;

  // 1. Validations
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

  // 2. Start a Database Session for Atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const followerId = new mongoose.Types.ObjectId(String(currUserId));
    const followingId = new mongoose.Types.ObjectId(String(targetUserId));

    // 3. Check if the follow already exists
    const existingFollow = await FollowModel.findOne({
      followerId,
      followingId,
    }).session(session);

    let action: "followed" | "unfollowed";

    if (!existingFollow) {
      // --- FOLLOW ACTION ---
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
      // --- UNFOLLOW ACTION ---
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

    // Commit all changes
    await session.commitTransaction();
    session.endSession();

    // 4. Fetch updated data
    const currentUserPipeline: PipelineStage[] = [
      { $match: { _id: followerId } },
      ...getUserAggregation({ authUserId: String(currUserId) }),
    ];
    const targetUserPipeline: PipelineStage[] = [
      { $match: { _id: followingId } },
      ...getUserAggregation({ authUserId: String(currUserId) }),
    ];

    const [updatedCurrentUser] = await UserModel.aggregate(currentUserPipeline);
    const [updatedTargetUser] = await UserModel.aggregate(targetUserPipeline);

    return res.status(200).json({
      message: `User ${action} successfully`,
      status: "SUCCESS",
      payload: {
        currentUser: updatedCurrentUser,
        targetUser: updatedTargetUser,
      },
    });
  } catch (error: any) {
    // Rollback changes if anything failed
    await session.abortTransaction();
    session.endSession();

    console.error("Follow Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to process follow action",
      status: "ERROR",
    });
  }
};

export default followUser;
