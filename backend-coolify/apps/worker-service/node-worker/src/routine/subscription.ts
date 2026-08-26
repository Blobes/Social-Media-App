import cron from "node-cron";
import { SubscriptionService } from "@repo/security";

/**
 * Worker routine to process and downgrade all expired canceled subscriptions.
 */
const runExpiredSubscriptionWorker = async (): Promise<void> => {
  try {
    const count = await SubscriptionService.processExpiredSubscriptions();
    console.log(
      `[Subscription Worker] Successfully cleaned up ${count} expired subscription(s).`,
    );
  } catch (error) {
    console.error("[Subscription Worker Error - Expired Cleanup]:", error);
  }
};

/**
 * Worker routine to flag accounts with past-due payments.
 */
const runPastDueSubscriptionWorker = async (): Promise<void> => {
  try {
    const count = await SubscriptionService.processPastDueSubscriptions();
    console.log(
      `[Subscription Worker] Marked ${count} subscription(s) as PAST_DUE.`,
    );
  } catch (error) {
    console.error("[Subscription Worker Error - Past Due Check]:", error);
  }
};

/**
 * Master worker task orchestrator intended for cron execution.
 */
const executeSubscriptionRoutines = async (): Promise<void> => {
  console.log("[Subscription Routines] Starting routine execution...");
  await runExpiredSubscriptionWorker();
  await runPastDueSubscriptionWorker();
  console.log("[Subscription Routines] Completed routine execution.");
};

/**
 * Initializes and schedules the automated background worker for subscription maintenance routines.
 */
export const startSubscriptionTask = (): void => {
  console.log(
    "Automated subscription routines cron worker initialized successfully.",
  );
  // Scheduled to execute daily at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    await executeSubscriptionRoutines();
  });
};
