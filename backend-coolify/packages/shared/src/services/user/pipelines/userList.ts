import { PipelineStage } from "mongoose";
import { getUserStaticData } from "./singleUser";

interface UserListOptions {
  matchFilter: Record<string, any>;
  skip?: number;
  limit?: number;
  showDeactivated?: boolean; // New flag added
}

export const getStaticUserList = ({
  matchFilter,
  skip = 0,
  limit = 20,
  showDeactivated = false, // Default to false to align with privacy standards
}: UserListOptions): PipelineStage[] => {
  // Construct the deletion filter
  // If showDeactivated is false, we explicitly only want users where isDeactivated is not true
  const deactivationFilter = showDeactivated
    ? {}
    : { accountStatus: { $ne: "DEACTIVATED" } };

  return [
    // Combine the incoming matchFilter with our deletion logic
    {
      $match: {
        ...matchFilter,
        ...deactivationFilter,
      },
    },

    // Performance: Sort and Paginate before joining or heavy lookups
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },

    // Inject the core user aggregation logic (lookups for media, followers, etc.)
    ...getUserStaticData(),
  ];
};
