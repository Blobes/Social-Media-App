import { PipelineStage, QueryFilter } from "mongoose";
import { IUserDocument } from "@repo/database";
import { getUserStaticData } from "./singleUser";

export interface UserListOptions<TUser = IUserDocument> {
  matchFilter?: QueryFilter<TUser>;
  skip?: number;
  limit?: number;
  includeRestricted?: boolean;
}

const DEFAULT_LIST_LIMIT = 20;

/**
 * Constructs an optimized, paginated aggregation pipeline for user listing feeds.
 */
export const getStaticUserList = <TUser = IUserDocument>({
  matchFilter = {},
  skip = 0,
  limit = DEFAULT_LIST_LIMIT,
  includeRestricted = false,
}: UserListOptions<TUser>): PipelineStage[] => {
  const restrictedFilter = includeRestricted
    ? {}
    : { accountStatus: { $nin: ["DEACTIVATED", "SUSPENDED", "BANNED"] } };

  return [
    {
      $match: {
        ...matchFilter,
        ...restrictedFilter,
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    ...getUserStaticData(),
  ];
};
