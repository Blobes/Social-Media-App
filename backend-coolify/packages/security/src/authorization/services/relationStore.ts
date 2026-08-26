import {
  RelationTupleModel,
  ObjectType,
  RelationType,
  SubjectType,
} from "@repo/database";
import {
  CACHE_EXPIRY,
  CACHE_KEYS,
  getOrSetCache,
  getOrSetCacheSet,
} from "@repo/shared";

export interface ICheckRelationParams {
  subjectId: string;
  subjectType?: SubjectType;
  relation: RelationType;
  objectType: ObjectType;
  objectId: string;
}

export class RelationStoreService {
  /**
   * Verifies whether a specific relation tuple exists using Read-Aside Redis caching.
   */
  public static async hasRelation(
    params: ICheckRelationParams,
  ): Promise<boolean> {
    const subjectType = params.subjectType ?? "user";
    const cacheKey = CACHE_KEYS.RELATION(
      params.subjectId,
      subjectType,
      params.relation,
      params.objectType,
      params.objectId,
    );

    return getOrSetCache<boolean>(
      cacheKey,
      async () => {
        const count = await RelationTupleModel.countDocuments({
          subjectId: params.subjectId,
          subjectType,
          relation: params.relation,
          objectType: params.objectType,
          objectId: params.objectId,
        });

        return count > 0;
      },
      CACHE_EXPIRY.HOUR_1,
    );
  }

  /**
   * Verifies if a user is blocked by a target user or vice versa using cached block lists.
   */
  public static async isBlocked(
    viewerId: string,
    targetUserId: string,
  ): Promise<boolean> {
    const fetchBlockedUserIds = async (userId: string): Promise<string[]> => {
      const cacheKey = CACHE_KEYS.BLOCKED_USERS(userId);

      return getOrSetCacheSet(
        cacheKey,
        async () => {
          const blocks = await RelationTupleModel.find({
            subjectId: userId,
            relation: "blocked",
            objectType: "user",
          }).lean();

          return blocks.map((block) => block.objectId.toString());
        },
        CACHE_EXPIRY.HOUR_24,
      );
    };

    const [viewerBlockedList, targetBlockedList] = await Promise.all([
      fetchBlockedUserIds(viewerId),
      fetchBlockedUserIds(targetUserId),
    ]);

    return (
      viewerBlockedList.includes(targetUserId) ||
      targetBlockedList.includes(viewerId)
    );
  }
}
