import cron from "node-cron";
import { UserModel } from "@repo/database";

/**
 * Resets user posting trackers to clean out metrics tracking windows.
 */
const resetModerationTimeframes = async (): Promise<void> => {
  try {
    console.log(
      "Initiating background reset query for user moderation tracking metrics...",
    );
    // Batch reset metrics fields for accounts containing tracking updates
    const updateResult = await UserModel.updateMany(
      {
        $or: [{ hasFlaggedPost: true }, { postCountWindow: { $gt: 0 } }],
      },
      {
        $set: {
          hasFlaggedPost: false,
          postCountWindow: 0,
        },
      },
    );

    console.log(
      `Successfully reset metrics fields for ${updateResult.modifiedCount} accounts.`,
    );
  } catch (error) {
    console.error(
      "Critical error inside background moderation tracking metrics reset loop:",
      error,
    );
  }
};

/**
 * Starts the automated background iteration cycle executing on precise 6-hour windows.
 */
export const startUserMetricsReset = (): void => {
  console.log(
    "Automated 6-hour trust metrics tracking cron worker initialized successfully.",
  );
  // Scheduled to execute precisely at minute 0 of every 6th hour
  cron.schedule("0 */6 * * *", async () => {
    await resetModerationTimeframes();
  });
};
