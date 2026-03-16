import cron from "node-cron";
import { UserModel } from "@/models/user/user";

export const initUserCleanup = () => {
  // Runs every day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log("Cleaning up expired user accounts...");

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Permanently delete users who were soft-deleted more than 30 days ago
      const result = await UserModel.deleteMany({
        isDeleted: true,
        deletedAt: { $lte: thirtyDaysAgo },
      });

      if (result.deletedCount > 0) {
        console.log(
          `Successfully purged ${result.deletedCount} expired accounts.`,
        );
      }
    } catch (error) {
      console.error("Cleanup Job Error:", error);
    }
  });
};
