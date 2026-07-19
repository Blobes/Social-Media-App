import { UserModel } from "@repo/database";
import { pruneDeadTopics, removeTopicsFromUser } from "@repo/shared";
import cron from "node-cron";

/**
 * Monthly Cleanup: Removes topics with zero posts or users.
 */
export const initTopicCleanup = () => {
  // '0 0 1 * *' = Midnight on the 1st of every month
  cron.schedule("0 0 1 * *", async () => {
    try {
      console.log("[Background Task] Starting monthly topic cleanup...");

      const result = await pruneDeadTopics();

      // Explicitly check for structural errors returned inside the successful promise execution
      if (result.status === "SERVER_ERROR") {
        console.error(
          `[Background Task] Monthly cleanup failed internally. Registry Message: ${result.transInfo.message}`,
        );
        return;
      }

      console.log(
        `[Background Task] Cleanup finished. Removed ${result.deletedCount} topics.`,
      );
    } catch (error: any) {
      console.error(
        "[Background Task] Monthly cleanup failed catastrophically:",
        error.message,
      );
    }
  });
};

/**
 * Weekly Cleanup: Prunes interests not viewed in the last 14 days.
 */
export const initUserTopicCleanup = () => {
  cron.schedule("0 0 * * 0", async () => {
    try {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      console.log(
        `[Interest Pruning] Identifying topics stale since ${fourteenDaysAgo.toISOString()}`,
      );

      // 1. Path fix: Query against 'preferences.preferredTopics.lastViewed'
      // 2. Select: Only bring back the preferences field to keep cursor memory low
      const cursor = UserModel.find({
        "preferences.preferredTopics.lastViewed": { $lt: fourteenDaysAgo },
      })
        .select("preferences.preferredTopics")
        .cursor();

      let processedUsers = 0;

      for (
        let user = await cursor.next();
        user != null;
        user = await cursor.next()
      ) {
        // Accessing the nested array correctly
        const topics = user.preferences?.preferredTopics || [];

        const staleTopicIds = topics
          .filter((t: any) => t.lastViewed < fourteenDaysAgo)
          .map((t: any) => t.topicId.toString()); // Schema fix: uses 'topicId', not '_id'

        if (staleTopicIds.length > 0) {
          // Shared utility handles the atomic $pull from preferences.preferredTopics
          await removeTopicsFromUser(user._id.toString(), staleTopicIds);
          processedUsers++;
        }
      }

      console.log(
        `[Interest Pruning] Completed. Cleaned up interests for ${processedUsers} users.`,
      );
    } catch (error: any) {
      console.error(
        "[Interest Pruning] Error during background task:",
        error.message,
      );
    }
  });
};
