import mongoose, { PipelineStage } from "mongoose";
import { UserModel } from "@/models/user/user";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import { getUserAggregation } from "@/utils/aggregator/singleUser";
import { userPrivateFields, userSensitiveFields } from "@/utils/sanitize";

const getUserProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  const targetUserId = req.params.id;
  const authUserId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      message: "Invalid user ID format",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    const isOwner = authUserId === targetUserId;

    // Aggregation ignores the pre('find') middleware, allowing us to find deactivated users
    const pipeline: PipelineStage[] = [
      { $match: { _id: new mongoose.Types.ObjectId(String(targetUserId)) } },
      ...getUserAggregation({ authUserId }),
    ];

    const users = await UserModel.aggregate(pipeline);

    if (!users || users.length === 0) {
      return res.status(404).json({
        message: "User not found",
        status: "ERROR",
        payload: null,
      });
    }

    const userProfile = users[0];

    // CASE 1: ACCOUNT IS DEACTIVATED
    if (userProfile.isDeleted) {
      return res.status(200).json({
        message: "This account has been deactivated",
        status: "DEACTIVATED",
        payload: {
          _id: userProfile._id,
          username: userProfile.username,
          profileImage: userProfile.profileImage,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          isDeleted: true,
          isOwner,
        },
      });
    }

    // Always remove internal security fields (password, codes, etc.)
    userSensitiveFields().forEach((field) => {
      delete userProfile[field];
    });

    // CASE 2: VISITING SOMEONE ELSE'S PROFILE (Privacy Filter)
    if (!isOwner) {
      // Remove PII (Phone, Email, DOB, etc.) for visitors
      userPrivateFields().forEach((field) => {
        delete userProfile[field];
      });
    }

    // CASE 3: SUCCESSFUL VIEW (Owner gets full profile, Visitor gets public profile)
    res.status(200).json({
      message: "User fetched successfully",
      status: "SUCCESS",
      payload: userProfile,
    });
  } catch (error: any) {
    console.error("Get User Error:", error);
    res.status(500).json({
      message: error.message || "Failed to get user due to server error",
      status: "ERROR",
      payload: null,
    });
  }
};

export default getUserProfile;
