import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import { GistModel } from "@/models/post/gist";
import mongoose, { PipelineStage } from "mongoose";
import { getPostAggregation } from "@/utils/aggregator/singlePost";

const getGist = async (req: AuthRequest, res: Response): Promise<void> => {
  const postId = req.params.id;
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    res.status(400).json({
      status: "ERROR",
      payload: null,
      message: "Invalid Post ID",
    });
    return;
  }

  try {
    // 1. Build the pipeline
    // We pass an object to getPostAggregation as per your updated utility definition
    const pipeline: PipelineStage[] = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(String(postId)),
          status: "ACTIVE",
        },
      },
      ...getPostAggregation({
        userId: userId ? String(userId) : undefined,
        postType: "GIST",
      }),
    ];

    // 2. Execute Aggregation
    const gist = await GistModel.aggregate(pipeline);

    // 3. Handle Result
    if (!gist || gist.length === 0) {
      res.status(404).json({
        status: "ERROR",
        payload: null,
        message: "Gist not found",
      });
      return;
    }

    // Return the first (and only) result from the aggregation array
    res.status(200).json({
      status: "SUCCESS",
      payload: gist[0],
      message: "Gist fetched successfully",
    });
  } catch (error: any) {
    console.error("Get Gist Error:", error);
    res.status(500).json({
      status: "ERROR",
      payload: null,
      message: error.message || "Internal Server Error",
    });
  }
};

export default getGist;
