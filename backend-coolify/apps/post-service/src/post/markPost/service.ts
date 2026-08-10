import {
  GistModel,
  StakeModel,
  PostViewModel,
  PostModelType,
  IGistDocument,
  IStakeDocument,
} from "@repo/database";
import { MESSAGES_REGISTRY, PostType, TransInfo } from "@repo/shared";
import mongoose from "mongoose";

export interface MarkPostSeenInput {
  postId: string;
  userId?: string;
  postType: PostType;
  postModelType: PostModelType;
}

export interface MarkPostSeenResult {
  status:
    | "INVALID_SESSION"
    | "INVALID_TYPE"
    | "SUCCESS_TIMESTAMP_UPDATED"
    | "SUCCESS_VIEW_RECORDED"
    | "SUCCESS_ALREADY_RECORDED";
  transInfo: TransInfo;
  payload: any;
}

/**
 * Mapping of post types to their respective database models.
 */
const POST_MODEL_MAP: Record<
  PostType,
  mongoose.Model<IGistDocument | IStakeDocument>
> = {
  GIST: GistModel,
  STAKE: StakeModel,
};

/**
 * Executes business logic to document post viewing interactions by tracking unique user identity references, updating counters, and purging stale application cache entries.
 */
export const executeMarkPostAsSeen = async (
  input: MarkPostSeenInput,
): Promise<MarkPostSeenResult> => {
  const { postId, userId, postType, postModelType } = input;

  if (!userId) {
    return {
      status: "INVALID_SESSION",
      transInfo: MESSAGES_REGISTRY.POST.INVALID_SESSION(postModelType),
      payload: null,
    };
  }

  const MainModel = POST_MODEL_MAP[postType];
  if (!MainModel) {
    return {
      status: "INVALID_TYPE",
      transInfo: MESSAGES_REGISTRY.POST.INVALID_POST_TYPE,
      payload: null,
    };
  }

  try {
    const existingView = await PostViewModel.findOne({ postId, userId }).lean();

    if (existingView) {
      await MainModel.findByIdAndUpdate(postId, {
        $set: { lastViewed: new Date() },
      });

      return {
        status: "SUCCESS_TIMESTAMP_UPDATED",
        transInfo: MESSAGES_REGISTRY.POST.TIMESTAMP_UPDATED,
        payload: null,
      };
    }

    await PostViewModel.create({ postId, userId, postType: postModelType });

    const updatedPost = await MainModel.findByIdAndUpdate(
      postId,
      {
        $set: { lastViewed: new Date() },
        $inc: { viewCount: 1 },
      },
      { new: true, lean: true },
    ).select("viewCount");

    return {
      status: "SUCCESS_VIEW_RECORDED",
      transInfo: MESSAGES_REGISTRY.POST.UNIQUE_VIEW_RECORDED,
      payload: {
        viewCount: updatedPost?.viewCount ?? 0,
      },
    };
  } catch (error: any) {
    if (error.code === 11000) {
      return {
        status: "SUCCESS_ALREADY_RECORDED",
        transInfo: MESSAGES_REGISTRY.POST.VIEW_ALREADY_RECORDED,
        payload: null,
      };
    }
    throw error;
  }
};
