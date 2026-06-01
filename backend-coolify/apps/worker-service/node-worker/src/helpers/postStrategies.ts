import { Model } from "mongoose";
import { GistModel, StakeModel } from "@repo/database";
import {
  finalizeGistCreation,
  finalizeGistUpdate,
  FinalizePostReq,
  IS3Config,
} from "@repo/shared";

import { finalizeStake } from "../processors/finalizeStake";

interface PostStrategy {
  model: Model<any>;
  finalizer: (
    params: FinalizePostReq,
    config: { s3Config: IS3Config; redisKey: string },
  ) => Promise<any>;
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
