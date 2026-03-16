import { PipelineStage } from "mongoose";
import { getUserAggregation } from "./singleUser";

interface UserListOptions {
  matchFilter: Record<string, any>;
  authUserId?: string;
  skip?: number;
  limit?: number;
  showDeleted?: boolean; // New flag added
}

export const getUserListAggregation = ({
  matchFilter,
  authUserId,
  skip = 0,
  limit = 20,
  showDeleted = false, // Default to false to align with privacy standards
}: UserListOptions): PipelineStage[] => {
  // Construct the deletion filter
  // If showDeleted is false, we explicitly only want users where isDeleted is not true
  const deletionFilter = showDeleted ? {} : { isDeleted: { $ne: true } };

  return [
    // Combine the incoming matchFilter with our deletion logic
    {
      $match: {
        ...matchFilter,
        ...deletionFilter,
      },
    },

    // Performance: Sort and Paginate before joining or heavy lookups
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },

    // Inject the core user aggregation logic (lookups for media, followers, etc.)
    ...getUserAggregation({ authUserId }),
  ];
};
