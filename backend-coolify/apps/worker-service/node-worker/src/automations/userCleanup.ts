import { s3Config } from "@/envVars";
import {
  executeAccountDeletion,
  fetchManyUsers,
  switchAccountStatus,
} from "@repo/shared";
import cron from "node-cron";

/**
 * Initializes the automated periodic cron worker to process user inactivity lifecycle shifts.
 */
export const initUserInactivityCleanup = () => {
  // Runs 3 times a week at midnight (00:00 on Tuesday, Thursday, and Saturday)
  cron.schedule("0 0 * * 2,4,6", async () => {
    console.log(
      "Running user account inactivity and stale lifecycle checks...",
    );

    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // --- PHASE 1: ACTIVE TO INACTIVE TRANSITIONS ---
      // Fetch users who are currently ACTIVE but haven't interacted with the platform in over 3 months
      const inactiveEligibleUsers = await fetchManyUsers({
        query: {
          accountStatus: "ACTIVE",
          lastActiveAt: { $lte: threeMonthsAgo },
        },
        select: ["_id"],
        flags: { lean: true, skipFilter: true },
      });

      if (inactiveEligibleUsers.length > 0) {
        console.log(
          `Found ${inactiveEligibleUsers.length} active users stale for 3+ months. Updating to INACTIVE...`,
        );

        await Promise.all(
          inactiveEligibleUsers.map(async (user) => {
            const targetUserId = user._id.toString();
            try {
              await switchAccountStatus({
                targetUserId,
                targetStatus: "INACTIVE",
                reason:
                  "Automated transition due to 3 months of account inactivity",
                changedByType: "SYSTEM",
                changedBy: null,
              });
            } catch (switchError) {
              console.error(
                `Failed transitioning user ${user._id} to INACTIVE:`,
                switchError,
              );
            }
          }),
        );
      }

      // --- PHASE 2: INACTIVE TO DEACTIVATED TRANSITIONS ---
      // Fetch users who have remained in an INACTIVE status for more than 6 months
      const inactiveUsers = await fetchManyUsers({
        query: {
          accountStatus: "INACTIVE",
          statusChangedAt: { $lte: sixMonthsAgo },
        },
        select: ["_id"],
        flags: { lean: true, skipFilter: true },
      });

      if (inactiveUsers.length > 0) {
        console.log(
          `Found ${inactiveUsers.length} inactive entries stagnant for 6+ months. Updating to DEACTIVATED...`,
        );

        await Promise.all(
          inactiveUsers.map(async (user) => {
            const targetUserId = user._id.toString();
            try {
              await switchAccountStatus({
                targetUserId,
                targetStatus: "DEACTIVATED",
                reason:
                  "Automated transition due to remaining in an inactive state for 6 months",
                changedByType: "SYSTEM",
                changedBy: null,
              });
            } catch (switchError) {
              console.error(
                `Failed transitioning user ${user._id} to DEACTIVATED:`,
                switchError,
              );
            }
          }),
        );
      }

      console.log(
        "User account inactivity lifecycle routine completed successfully.",
      );
    } catch (error) {
      console.error(
        "Critical error inside Inactivity Lifecycle Cleanup Worker:",
        error,
      );
    }
  });
};

/**
 * Initializes the automated nightly task worker to permanently purge deactivated user data footprints.
 */
export const initUserDeactivatedCleanup = () => {
  // Runs 3 times a week at midnight (00:00 on Tuesday, Thursday, and Saturday)
  cron.schedule("0 0 * * 2,4,6", async () => {
    console.log("Cleaning up expired user accounts...");
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // Fetch users who have remained deactivated for longer than 3 months
      const expiredUsers = await fetchManyUsers({
        query: {
          accountStatus: "DEACTIVATED",
          statusChangedAt: { $lte: threeMonthsAgo },
        },
        select: ["_id"],
        flags: { lean: true, skipFilter: true },
      });

      if (expiredUsers.length === 0) {
        console.log("No expired deactivated accounts found for cleanup.");
        return;
      }

      console.log(
        `Found ${expiredUsers.length} accounts ready for permanent deletion. Processing...`,
      );

      let successfulDeletionsCount = 0;

      // Process each user through the centralized cascading delete service
      await Promise.all(
        expiredUsers.map(async (user) => {
          try {
            const result = await executeAccountDeletion({
              targetUserId: user._id.toString(),
              s3Config,
            });

            if (result.status === "SUCCESS") {
              successfulDeletionsCount++;
            }
          } catch (singleUserError) {
            console.error(`Failed to purge user ${user._id}:`, singleUserError);
          }
        }),
      );

      if (successfulDeletionsCount > 0) {
        console.log(
          `Successfully purged ${successfulDeletionsCount} out of ${expiredUsers.length} expired accounts.`,
        );
      }
    } catch (error) {
      console.error("Cleanup Job Error:", error);
    }
  });
};
