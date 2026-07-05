import mongoose from "mongoose";
import { GistModel, IPostStatus } from "@repo/database";
import { getStaticPostList, MESSAGES_REGISTRY, TransInfo } from "@repo/shared";

export interface GetUserDraftPostsInput {
  targetUserId: string;
  authUserId?: string;
  page: number;
  limit: number;
}

export interface GetUserDraftPostsResult {
  status: "INVALID_ID" | "FORBIDDEN" | "SUCCESS";
  transInfo: TransInfo;
  payload: any[];
  meta?: {
    totalDocs: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}

/**
 * Validates privacy access permissions and queries the database layer for an isolated list of private draft posts.
 */
export const executeGetUserDraftPosts = async (
  input: GetUserDraftPostsInput,
): Promise<GetUserDraftPostsResult> => {
  const { targetUserId, authUserId, page, limit } = input;
  const skip = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return {
      status: "INVALID_ID",
      transInfo: MESSAGES_REGISTRY.POST.INVALID_USER_ID_FORMAT,
      payload: [],
    };
  }

  if (!authUserId || authUserId.toString() !== targetUserId) {
    return {
      status: "FORBIDDEN",
      transInfo: MESSAGES_REGISTRY.POST.ACCESS_DENIED_OWN_DRAFTS_ONLY(),
      payload: [],
    };
  }

  const matchFilter = {
    authorId: new mongoose.Types.ObjectId(String(targetUserId)),
    status: "DRAFT" as IPostStatus,
  };

  const totalCount = await GistModel.countDocuments(matchFilter);

  const pipeline = getStaticPostList({
    matchFilter,
    limit,
    skip,
  });

  const draftPosts = await GistModel.aggregate(pipeline);

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.USER_DRAFTS_RETRIEVED_SUCCESSFULLY,
    payload: draftPosts,
    meta: {
      totalDocs: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit,
      hasNextPage: skip + draftPosts.length < totalCount,
    },
  };
};
