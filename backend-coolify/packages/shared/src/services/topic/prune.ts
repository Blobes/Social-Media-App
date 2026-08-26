import { TopicModel } from "@repo/database";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { TransInfo } from "../../types/general";
import { INVALIDATE_CACHE } from "../../constants/invalidators";

export interface PruneUnusedTopicsResult {
  status: "SUCCESS" | "SERVER_ERROR";
  transInfo: TransInfo;
  deletedCount: number;
}

/**
 * Scans the database directly to identify and delete topics without remaining active entity bindings.
 */
export const pruneDeadTopics = async (): Promise<PruneUnusedTopicsResult> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query = {
      userCount: 0,
      postCount: 0,
      createdAt: { $lt: thirtyDaysAgo },
    };

    // Execute the bulk deletion globally across the collection using the defined conditions
    const result = await TopicModel.deleteMany(query);

    // Invalidate topics lookup cache
    await INVALIDATE_CACHE.forTopics();

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.POST.POST_TOPICS_PRUNED(result.deletedCount),
      deletedCount: result.deletedCount,
    };
  } catch (err: any) {
    console.error(
      "Database execution failure during topic pruning:",
      err.message,
    );

    return {
      status: "SERVER_ERROR",
      transInfo: MESSAGES_REGISTRY.SYSTEM.INTERNAL_SERVER_ERROR,
      deletedCount: 0,
    };
  }
};
