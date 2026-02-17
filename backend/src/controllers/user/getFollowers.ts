import mongoose from "mongoose";
import { UserModel } from "@/models";
import { Request, Response } from "express";

export const getFollowers = async (
  req: Request,
  res: Response
): Promise<any> => {
  const userId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      message: "User ID format is not valid",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    const user = await UserModel.findById(userId)
      .populate("followers", "_id username firstName lastName profileImage")
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: "ERROR",
        payload: null,
      });
    }

    res.status(200).json({
      message: "Followers fetched successfully",
      status: "SUCCESS",
      payload: user.followers || [],
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to fetch followers due to server error",
      status: "ERROR",
      payload: null,
    });
  }
};
