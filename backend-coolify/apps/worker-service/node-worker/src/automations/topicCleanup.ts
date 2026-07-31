import { IUserPreferredTopic, UserSettingsModel } from "@repo/database";
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
    } catch (error: unknown) {
      const err = error as Error;
      console.error(
        "[Background Task] Monthly cleanup failed catastrophically:",
        err.message,
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

      // Query against displayAndApp.contentPreferences.preferredTopics.lastViewed
      const cursor = UserSettingsModel.find({
        "displayAndApp.contentPreferences.preferredTopics.lastViewed": {
          $lt: fourteenDaysAgo,
        },
      })
        .select("userId displayAndApp.contentPreferences.preferredTopics")
        .cursor();

      let processedUsers = 0;

      for (
        let userSettings = await cursor.next();
        userSettings != null;
        userSettings = await cursor.next()
      ) {
        // Access nested array from user settings schema
        const topics =
          userSettings.display?.contentPreferences?.preferredTopics || [];

        const staleTopicIds = topics
          .filter(
            (t: IUserPreferredTopic) =>
              t.lastViewed && new Date(t.lastViewed) < fourteenDaysAgo,
          )
          .map((t: IUserPreferredTopic) => t.topicId.toString());

        if (staleTopicIds.length > 0 && userSettings.userId) {
          // Remove stale topics from user's settings document
          await removeTopicsFromUser(
            userSettings.userId.toString(),
            staleTopicIds,
          );
          processedUsers++;
        }
      }

      console.log(
        `[Interest Pruning] Completed. Cleaned up interests for ${processedUsers} users.`,
      );
    } catch (error: unknown) {
      const err = error as Error;
      console.error(
        "[Interest Pruning] Error during background task:",
        err.message,
      );
    }
  });
};
