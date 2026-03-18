import { GistModel } from "@repo/database";
import { IAuthRequest, getPostAggregation } from "@repo/shared";
import { Response } from "express";
import { PipelineStage } from "mongoose";

export const getGistList = async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  // Using the ID from the token for 'likedByMe' logic
  const userId = req.user?.id;

  try {
    // 1. Pagination Logic
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // 2. Build the Pipeline
    const pipeline: PipelineStage[] = [
      // Filter active gists
      { $match: { status: "ACTIVE" } },

      // Sort before pagination to ensure consistent results
      { $sort: { createdAt: -1 } },

      // Pagination stages
      { $skip: skip },
      { $limit: limit },

      // Apply the common formatting (Author, Media, Likes)
      // Updated to match the ({ userId, sourceType }) signature
      ...getPostAggregation({
        userId: userId ? String(userId) : undefined,
        postType: "GIST",
      }),
    ];

    // 3. Execute the Aggregation
    const gists = await GistModel.aggregate(pipeline);

    // 4. Response Handling
    res.status(200).json({
      status: "SUCCESS",
      payload: gists,
      message:
        gists.length > 0 ? "Gists fetched successfully" : "No gists found",
      meta: {
        count: gists.length,
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error("Fetch Gists Aggregation Error:", error);
    res.status(500).json({
      status: "ERROR",
      payload: null,
      message: error.message || "An error occurred while fetching gists",
    });
  }
};
