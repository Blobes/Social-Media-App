import cron from "node-cron";
import { DeviceModel, UserModel } from "@repo/database";

/**
 * Background maintenance with a grace period for stale primary devices.
 */
export const startDeviceCleanupTask = () => {
  cron.schedule("0 3 * * *", async () => {
    try {
      const PURGE_THRESHOLD = 30; // Days until a non-primary or stale device is deleted
      const GRACE_PERIOD_DAYS = 7; // Extra days allowed for stale primaries before purging

      const thirtyDaysAgo = new Date(
        Date.now() - PURGE_THRESHOLD * 24 * 60 * 60 * 1000,
      );
      const purgeDateWithGrace = new Date(
        thirtyDaysAgo.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
      );

      // 1. Purge non-primaries older than 30 days
      await DeviceModel.deleteMany({
        lastSeenAt: { $lt: thirtyDaysAgo },
        isPrimary: { $ne: true },
      });

      // 2. Purge devices already marked as stale that have exceeded the grace period
      await DeviceModel.deleteMany({
        isStale: true,
        lastSeenAt: { $lt: purgeDateWithGrace },
      });

      // 3. Process primary devices that have just hit the 30-day inactivity mark
      const ghostCursor = DeviceModel.find({
        lastSeenAt: { $lt: thirtyDaysAgo },
        isPrimary: true,
        isStale: { $ne: true }, // Only process those not already in grace period
      })
        .lean()
        .cursor();

      let userUpdates = [];
      let deviceUpdates = [];
      let devicesToDelete = [];

      for (
        let ghost = await ghostCursor.next();
        ghost != null;
        ghost = await ghostCursor.next()
      ) {
        // Try to find a modern replacement that is still active
        const replacement = await DeviceModel.findOne({
          userId: ghost.userId,
          _id: { $ne: ghost._id },
          lastSeenAt: { $gte: thirtyDaysAgo },
        })
          .sort({ lastSeenAt: -1 })
          .lean();

        if (replacement) {
          // New primary found: promote replacement and queue ghost for immediate deletion
          userUpdates.push({
            updateOne: {
              filter: { _id: ghost.userId },
              update: { $set: { primaryDeviceId: replacement._id } },
            },
          });

          deviceUpdates.push({
            updateOne: {
              filter: { _id: replacement._id },
              update: { $set: { isPrimary: true, isStale: false } },
            },
          });

          devicesToDelete.push(ghost._id);
        } else {
          // No active replacement: flag as stale and enter grace period
          deviceUpdates.push({
            updateOne: {
              filter: { _id: ghost._id },
              update: { $set: { isStale: true } },
            },
          });
        }

        // Batch execution logic
        if (userUpdates.length >= 100) {
          await Promise.all([
            UserModel.bulkWrite(userUpdates),
            DeviceModel.bulkWrite(deviceUpdates),
            DeviceModel.deleteMany({ _id: { $in: devicesToDelete } }),
          ]);
          userUpdates = [];
          deviceUpdates = [];
          devicesToDelete = [];
        }
      }

      // Final flush
      if (
        userUpdates.length > 0 ||
        deviceUpdates.length > 0 ||
        devicesToDelete.length > 0
      ) {
        await Promise.all([
          userUpdates.length > 0
            ? UserModel.bulkWrite(userUpdates)
            : Promise.resolve(),
          deviceUpdates.length > 0
            ? DeviceModel.bulkWrite(deviceUpdates)
            : Promise.resolve(),
          devicesToDelete.length > 0
            ? DeviceModel.deleteMany({ _id: { $in: devicesToDelete } })
            : Promise.resolve(),
        ]);
      }
    } catch (error) {
      console.error("[Cron] Grace-Period Cleanup Error:", error);
    }
  });
};
