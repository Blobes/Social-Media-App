import mongoose, { PipelineStage } from "mongoose";
import { UserModel } from "@/models/user/user";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import { getUserAggregation } from "@/utils/aggregator/singleUser";

const getUser = async (req: AuthRequest, res: Response): Promise<any> => {
  const targetUserId = req.params.id;
  const authUserId = req.user?.id; // Logged-in user from middleware

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      message: "Invalid user ID format",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    // Execute the aggregation
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

    res.status(200).json({
      message: "User fetched successfully",
      status: "SUCCESS",
      payload: users[0],
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

export default getUser;
