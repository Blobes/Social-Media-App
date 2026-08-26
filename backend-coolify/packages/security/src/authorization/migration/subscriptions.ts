import { SubscriptionModel, UserModel } from "@repo/database";

/**
 * Backfills default FREE tier subscriptions for all existing users lacking a subscription document.
 */
export const backfillExistingUserSubscriptions = async (): Promise<void> => {
  const usersWithoutSubscriptions = await UserModel.aggregate([
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "userId",
        as: "subscription",
      },
    },
    { $match: { subscription: { $size: 0 } } },
    { $project: { _id: 1 } },
  ]);

  if (usersWithoutSubscriptions.length === 0) {
    return;
  }

  const subscriptionDocs = usersWithoutSubscriptions.map((user) => ({
    userId: user._id,
    tier: "FREE" as const,
    status: "ACTIVE" as const,
    currentPeriodStart: new Date(),
  }));

  await SubscriptionModel.bulkWrite(
    subscriptionDocs.map((sub) => ({
      updateOne: {
        filter: { userId: sub.userId },
        update: { $setOnInsert: sub },
        upsert: true,
      },
    })),
  );
};
