import { UserModel, ModerationStrikeModel } from "@repo/database";
import cron from "node-cron";

/**
 * Schedules and executes the daily background sync for account verification eligibility.
 */
export const startEligibilityWorker = () => {
  // Runs every day at 02:00 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("Starting Unified Eligibility Sync...");

    try {
      const NINETY_DAYS_AGO = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // Fetch accounts currently carrying active moderation strikes
      const activeStrikeAccountIds = await ModerationStrikeModel.distinct(
        "account",
        {
          isActive: true,
        },
      );

      // Grant eligibility criteria: Requires at least one verified contact method
      const granted = await UserModel.updateMany(
        {
          meritsVerification: false,
          isPublicFigure: false,
          $or: [{ isEmailVerified: true }, { isPhoneVerified: true }],
          createdAt: { $lte: NINETY_DAYS_AGO },
          accountStatus: "ACTIVE",
          policyBreachCount: 0,
          _id: { $nin: activeStrikeAccountIds },
          followersCount: { $gte: 500 },
        },
        { $set: { meritsVerification: true } },
      );

      // Revoke eligibility criteria: Revokes if high risk or both contact methods are unverified
      const revoked = await UserModel.updateMany(
        {
          meritsVerification: true,
          isPublicFigure: false,
          $or: [
            { policyBreachCount: { $gt: 3 } },
            { _id: { $in: activeStrikeAccountIds } },
            { followersCount: { $lt: 450 } },
            { accountStatus: { $ne: "ACTIVE" } },
            { isEmailVerified: false, isPhoneVerified: false },
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
