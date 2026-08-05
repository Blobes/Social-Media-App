import cron from "node-cron";
import { Types } from "mongoose";
import { ModerationCaseModel, UserModel } from "@repo/database";
import { fetchManyUsers, switchAccountStatus } from "@repo/shared";

/**
 * Sweeps and penalizes malicious profiles that have been repeatedly suspended.
 */
async function processAutomatedProfileBans(): Promise<void> {
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  const violators = await ModerationCaseModel.aggregate([
    {
      $match: {
        status: "RESOLVED",
        decision: "ACCOUNT_SUSPENDED",
        resolvedAt: { $gte: twoMonthsAgo },
      },
    },
    {
      $group: {
        _id: "$targetOwner",
        suspensionCount: { $sum: 1 },
      },
    },
    {
      $match: {
        suspensionCount: { $gt: 15 },
      },
    },
  ]);

  if (violators.length === 0) return;

  const violatorIds = violators.map((v) => v._id);

  const activeViolators = await fetchManyUsers({
    query: {
      _id: { $in: violatorIds },
      accountStatus: { $in: ["ACTIVE", "SUSPENDED"] },
    },
    select: ["_id"],
    flags: { skipFilter: true },
  });

  for (const user of activeViolators) {
    const targetUserId = (user._id as Types.ObjectId).toString();
    await switchAccountStatus({
      targetUserId,
      targetStatus: "BANNED",
      reason: `Automated permanent ban enforced by system background worker. Exceeded 15 historical suspensions within a 2-month window.`,
      changedBy: "SYSTEM",
      changedByType: "SYSTEM",
    });
  }
}

/**
 * Identifies expired user suspensions and restores account access.
 */
async function processExpiredSuspensions(): Promise<void> {
  const now = new Date();
  const expiredSuspendedUsers = await fetchManyUsers({
    query: {
      accountStatus: "SUSPENDED",
      suspensionExpiresAt: { $ne: null, $lte: now },
    },
    select: ["_id"],
    flags: { skipFilter: true },
  });

  for (const user of expiredSuspendedUsers) {
    const targetUserId = (user._id as Types.ObjectId).toString();
    await switchAccountStatus({
      targetUserId,
      targetStatus: "ACTIVE",
      reason:
        "Automated account unsuspension triggered by worker due to expiration period completion.",
      changedBy: "SYSTEM",
      changedByType: "SYSTEM",
    });
  }
}

/**
 * Resets policy breach metrics for users clear of violations or cases for 6 months.
 */
async function processPolicyBreachResets(): Promise<void> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const activeCaseUserIds = await ModerationCaseModel.distinct("targetOwner", {
    $or: [
      { status: { $in: ["OPEN", "UNDER_REVIEW"] } },
      {
        status: "RESOLVED",
        decision: {
          $in: [
            "ACCOUNT_SUSPENDED",
            "STRIKE_ISSUED",
            "CONTENT_REMOVED",
            "ACCOUNT_BANNED",
          ],
        },
      },
    ],
    createdAt: { $gte: sixMonthsAgo },
  });

  await UserModel.updateMany(
    {
      policyBreachCount: { $gt: 0 },
      _id: { $nin: activeCaseUserIds },
    },
    {
      $set: {
        policyBreachCount: 0,
        updatedAt: new Date(),
      },
    },
  );
}

/**
 * Initializes the automated account maintenance scheduler.
 */
export const initModerationCleanup = () => {
  // Runs 3 times a week at midnight (00:00 on Tuesday, Thursday, and Saturday)
  cron.schedule("0 0 * * 2,4,6", async () => {
    try {
      await processAutomatedProfileBans();
      await processExpiredSuspensions();
      await processPolicyBreachResets();
    } catch (error) {
      console.error(
        "Error executing moderation lifecycle maintenance worker:",
        error,
      );
    }
  });
};
