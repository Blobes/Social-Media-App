import mongoose, { Model } from "mongoose";
import { GistModel, IMediaModel, StakeModel } from "@repo/database";
import { PostType } from "@repo/shared";
import { finalizeGistCreation, finalizeGistUpdate } from "./finalizeGist";
import { finalizeStake } from "./finalizeStake";

export interface FinalizePostParams {
  postId: string;
  userId: string;
  postType: PostType;
  caption: string;
  media: IMediaModel[];
  event: "POST_CREATION" | "POST_UPDATE";
  modResult: {
    status: string;
    severity: string;
    topics: string[];
    reason?: string;
  };
  session: mongoose.ClientSession;
}

interface PostStrategy {
  model: Model<any>;
  finalizer: (params: FinalizePostParams) => Promise<any>;
  displayName: string;
}

export const POST_STRATEGIES: Record<string, PostStrategy> = {
  GIST_POST_CREATION: {
    model: GistModel,
    finalizer: finalizeGistCreation,
    displayName: "Gist",
  },
  GIST_POST_UPDATE: {
    model: GistModel,
    finalizer: finalizeGistUpdate,
    displayName: "Gist",
  },
  STAKE_POST_CREATION: {
    model: StakeModel,
    finalizer: finalizeStake,
    displayName: "Stake",
  },
  STAKE_POST_UPDATE: {
    model: StakeModel,
    finalizer: finalizeStake,
    displayName: "Stake",
  },
};
