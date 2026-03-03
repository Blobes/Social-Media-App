import { PipelineStage } from "mongoose";
import { getUserAggregation } from "./singleUser";

interface UserListOptions {
  matchFilter: Record<string, any>;
  authUserId?: string;
  skip?: number;
  limit?: number;
}

export const getUserListAggregation = ({
  matchFilter,
  authUserId,
  skip = 0,
  limit = 20,
}: UserListOptions): PipelineStage[] => {
  return [
    // Step 1: Filter and Paginate first for maximum performance
    { $match: matchFilter },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },

    // Step 2: Inject the core user aggregation logic
    ...getUserAggregation({ authUserId }),
  ];
};
