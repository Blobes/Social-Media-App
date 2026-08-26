import cron from "node-cron";
import { ErrorLogModel } from "@repo/database";

/**
 * Initializes scheduled cron timers managing standard retention policies for historical application traces.
 */
export const startErrorLogCleanupTask = (): void => {
  cron.schedule("0 4 * * *", async () => {
    try {
      const RETENTION_PERIOD_DAYS = 30;
      const startTime = Date.now();
      const retentionDate = new Date(
        Date.now() - RETENTION_PERIOD_DAYS * 24 * 60 * 60 * 1000,
      );

      console.log(`[Cron] Initiating error logs cleanup worker...`);

      const expiredCursor = ErrorLogModel.find({
        createdAt: { $lt: retentionDate },
      })
        .select("_id")
        .lean()
        .cursor();

      let targetIdsBuffer: any[] = [];
      let executionCounter = 0;

      for (
        let targetLog = await expiredCursor.next();
        targetLog != null;
        targetLog = await expiredCursor.next()
      ) {
        targetIdsBuffer.push(targetLog._id);
        executionCounter += 1;

        if (targetIdsBuffer.length >= 100) {
          await ErrorLogModel.deleteMany({ _id: { $in: targetIdsBuffer } });
          targetIdsBuffer = [];
        }
      }

      if (targetIdsBuffer.length > 0) {
        await ErrorLogModel.deleteMany({ _id: { $in: targetIdsBuffer } });
      }

      const executionTimeMs = Date.now() - startTime;
      console.log(
        `[Cron] Error log cleanup completed. Purged ${executionCounter} records in ${executionTimeMs}ms.`,
      );
    } catch (error: any) {
      console.error("[Cron] Error log cleanup worker failure:", error);
    }
  });
};
