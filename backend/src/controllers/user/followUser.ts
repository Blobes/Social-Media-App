import mongoose from "mongoose";
import { UserModel } from "@/models";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";

export const followUser = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  const targetUserId = req.params.id;
  const currUserId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      message: "Invalid user ID format",
      status: "ERROR",
      payload: null,
    });
  }

  if (!currUserId || !mongoose.Types.ObjectId.isValid(currUserId)) {
    return res
      .status(400)
      .json({ message: "Current user ID format not valid", status: "ERROR" });
  }

  if (currUserId === targetUserId) {
    return res.status(403).json({
      message: "You can't follow yourself",
      status: "ERROR",
    });
  }

  try {
    const targetUser = await UserModel.findById(targetUserId);
    const currentUser = await UserModel.findById(currUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({
        message: "User not found",
        status: "ERROR",
      });
    }

    let action;
    if (!targetUser.followers.includes(currUserId)) {
      // Follow: use update operators with atomic $addToSet instead of $push to avoid duplicates
      await targetUser.updateOne({ $addToSet: { followers: currUserId } });
      await currentUser.updateOne({ $addToSet: { following: targetUserId } });
      action = "followed";
    } else {
      // Unfollow
      await targetUser.updateOne({ $pull: { followers: currUserId } });
      await currentUser.updateOne({ $pull: { following: targetUserId } });
      action = "unfollowed";
    }

    // Fetch both users info without sensitive data
    const extractedInfo =
      "email username firstName lastName profileImage followers following ";
    const updatedCurrentUser = await UserModel.findById(currUserId)
      .select(extractedInfo)
      .lean();
    const updatedTargetUser = await UserModel.findById(targetUserId)
      .select(extractedInfo)
      .lean();

    return res.status(200).json({
      message: `User ${action}.`,
      status: "SUCCESS",
      payload: {
        currentUser: updatedCurrentUser,
        targetUser: updatedTargetUser,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed due to server error",
      status: "ERROR",
    });
  }
};

export default followUser;
