import { GistModel, StakeModel } from "@repo/database";
import { finalizeGist } from "./finalizeGist";
import { Model } from "mongoose";
import { finalizeStake } from "./finalizeStake";

interface PostStrategy {
  model: Model<any>;
  finalizer: (params: any) => Promise<any>;
  displayName: string;
}

export const POST_STRATEGIES: Record<string, PostStrategy> = {
  GIST: {
    model: GistModel,
    finalizer: finalizeGist,
    displayName: "Gist",
  },
  STAKE: {
    model: StakeModel,
    finalizer: finalizeStake,
    displayName: "Stake",
  },
};
