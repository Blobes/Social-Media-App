import { PipelineStage } from "mongoose";
import { getPostAggregation } from "./singlePost";

interface ListOptions {
  matchFilter: Record<string, any>;
  limit?: number;
  skip?: number;
  userId?: string;
}

export const getPostListAggregation = ({
  matchFilter,
  limit = 20,
  skip = 0,
  userId,
}: ListOptions): PipelineStage[] => {
  return [
    // 1. Initial Gist Match
    { $match: matchFilter },

    // 2. Apply Gist-specific logic
    ...getPostAggregation({ userId, postType: "GIST" }),

    // 3. Union with Stakes
    {
      $unionWith: {
        coll: "stakes",
        // The Fix: Cast the sub-pipeline to 'any[]' or a filtered union.
        // In the context of Mongoose's internal union types, casting to 'any'
        // here is the most stable way to bypass the terminal-stage restriction.
        pipeline: [
          { $match: matchFilter },
          ...getPostAggregation({ userId, postType: "STAKE" }),
        ] as any[],
      },
    },

    // 4. Global Feed Management
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];
};
