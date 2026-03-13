import cron from "node-cron";
import { pruneDeadTopics, removeTopicsFromUser } from "./action";
import { UserModel } from "@/models/user/user";

export const initTopicCleanup = () => {
  // '0 0 1 * *' = Minute 0, Hour 0, Day 1, Every Month, Every Weekday
  cron.schedule("0 0 1 * *", async () => {
    try {
      console.log("[Background Task] Starting monthly topic cleanup...");

      const deletedCount = await pruneDeadTopics();

      console.log(
        `[Background Task] Monthly cleanup finished. Removed ${deletedCount} stale topics.`,
      );
    } catch (error: any) {
      console.error("[Background Task] Monthly cleanup failed:", error.message);
    }
  });
};

/**
 * Weekly Cleanup: Runs every Sunday at 00:00.
 * Prunes topics not viewed in the last 14 days.
 */
export const initUserTopicCleanup = () => {
  // '0 0 * * 0' = Every Sunday at midnight
  cron.schedule("0 0 * * 0", async () => {
    try {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      console.log(
        `[Interest Pruning] Identifying topics stale since ${fourteenDaysAgo.toISOString()}`,
      );

      // We only fetch users who actually have at least one stale topic to save memory
      const cursor = UserModel.find({
        "preferredTopics.lastViewed": { $lt: fourteenDaysAgo },
      })
        .select("_id preferredTopics")
        .cursor();

      let processedUsers = 0;

      // Using a cursor for large datasets to avoid loading all users into RAM at once
      for (
        let user = await cursor.next();
        user != null;
        user = await cursor.next()
      ) {
        const staleTopicIds = user.preferredTopics
          .filter((t: any) => t.lastViewed < fourteenDaysAgo)
          .map((t: any) => t._id.toString());

        if (staleTopicIds.length > 0) {
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
