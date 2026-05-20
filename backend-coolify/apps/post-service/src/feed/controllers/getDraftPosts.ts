import { GistModel, IPostStatus } from "@repo/database";
import { IAuthRequest, getStaticPostList } from "@repo/shared";
import { Response } from "express";
import mongoose from "mongoose";

/**
 * Retrieves the private, isolated collection of unpublished draft posts belonging strictly to the authenticated user.
 */
export const getUserDraftPosts = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const targetUserId = req.params.id as string;
  const authUserId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      status: "ERROR",
      message: "Invalid User ID format",
    });
  }

  // Enforce boundary restriction rules protecting private draft states from cross-account lookups
  if (!authUserId || authUserId.toString() !== targetUserId) {
    return res.status(403).json({
      status: "ERROR",
      message: "Access Denied. You can only view your own drafts.",
    });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const matchFilter = {
      authorId: new mongoose.Types.ObjectId(String(targetUserId)),
      status: "DRAFT" as IPostStatus,
    };

    // Evaluate draft totals from primary data sources bypassing redis structures entirely
    const totalCount = await GistModel.countDocuments(matchFilter);

    const pipeline = getStaticPostList({
      matchFilter,
      limit,
      skip,
    });

    const draftPosts = await GistModel.aggregate(pipeline);

    return res.status(200).json({
      status: "SUCCESS",
      payload: draftPosts,
      message: "User drafts retrieved successfully",
      meta: {
        totalDocs: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
        hasNextPage: skip + draftPosts.length < totalCount,
      },
    });
  } catch (error: any) {
    console.error("Get User Draft Posts Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Internal Server Error",
    });
  }
};
