import { GistModel } from "@repo/database";
import { Response } from "express";
import { AuthRequest } from "../../middlewares/verifyAuthToken";
import { getPostListAggregation } from "../../utils/aggregator/postList";

export const getAllPost = async (req: AuthRequest, res: Response) => {
  try {
    const authUserId = req.user?.id; // Important for the 'likedByMe' logic

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Expert Tip: Always filter out inactive or private content for a global feed
    const matchFilter = {
      status: "ACTIVE",
      // isPublic: true // Uncomment if you have a privacy flag
    };

    const pipeline = getPostListAggregation({
      matchFilter,
      userId: authUserId, // Passing this enables the polymorphic like check
      limit,
      skip,
    });

    const feed = await GistModel.aggregate(pipeline);

    // 200 OK is preferred over 404 for empty feeds in modern REST
    res.status(200).json({
      status: "SUCCESS",
      message: feed.length > 0 ? "Feed retrieved" : "No posts found",
      payload: feed,
      meta: {
        page,
        limit,
        count: feed.length,
      },
    });
  } catch (error: any) {
    console.error("Feed Error:", error);
    res.status(500).json({
      status: "ERROR",
      payload: null,
      message: error.message || "An error occurred while fetching the feed",
    });
  }
};
