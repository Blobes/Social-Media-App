import { UserModel } from "@repo/database";
import cron from "node-cron";

export const startEligibilityWorker = () => {
  // Runs every day at 02:00 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("Starting Unified Eligibility Sync...");

    try {
      const NINETY_DAYS_AGO = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // --- TASK 1: GRANT ELIGIBILITY ---
      // Target: Users who meet all 2026 industry standards
      const granted = await UserModel.updateMany(
        {
          meritsVerification: false,
          isPublicFigure: false,
          isEmailVerified: true,
          isPhoneVerified: true,
          createdAt: { $lte: NINETY_DAYS_AGO },
          isDeactivated: false,
          moderationStrikes: 0,
          followersCount: { $gte: 500 }, // Grant threshold
        },
        { $set: { meritsVerification: true } },
      );

      // --- TASK 2: REVOKE ELIGIBILITY ---
      // Target: Users who previously qualified but are now "High Risk"
      // Note: We use 450 as a "Buffer" to prevent flickering status
      const revoked = await UserModel.updateMany(
        {
          meritsVerification: true,
          isPublicFigure: false,
          $or: [
            { moderationStrikes: { $gt: 0 } },
            { followersCount: { $lt: 450 } }, // Revoke threshold
            { isDeactivated: true },
          ],
        },
        { $set: { meritsVerification: false } },
      );

      console.log(
        `Sync Complete: [Grants: ${granted.modifiedCount}] [Revokes: ${revoked.modifiedCount}]`,
      );
    } catch (error) {
      console.error("Eligibility Worker Critical Error:", error);
    }
  });
};
