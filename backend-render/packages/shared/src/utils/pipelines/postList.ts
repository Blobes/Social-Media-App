import { PipelineStage } from "mongoose";
import { getPostStaticData } from "./singlePost";

interface ListOptions {
  matchFilter: Record<string, any>;
  limit?: number;
  skip?: number;
  postType?: "GIST" | "STAKE";
}

export const getStaticPostList = ({
  matchFilter,
  limit = 20,
  skip = 0,
  postType,
}: ListOptions): PipelineStage[] => {
  const pipeline: PipelineStage[] = [];

  const initialType = postType || "GIST";

  pipeline.push(
    { $match: matchFilter },
    { $addFields: { postType: initialType } },
  );

  if (!postType) {
    pipeline.push({
      $unionWith: {
        coll: "stakes",
        pipeline: [
          { $match: matchFilter },
          { $addFields: { postType: "STAKE" } },
        ] as any[],
      },
    });
  }

  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  );

  // Apply the purely static content projection
  pipeline.push(...getPostStaticData());

  return pipeline;
};
