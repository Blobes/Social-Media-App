import mongoose from "mongoose";
import { ROLES, UserRoleModel } from "@repo/database";
import { assignUserRole, SubscriptionService } from "@repo/security";

interface ISyncOptions {
  session?: mongoose.ClientSession;
  skipCheck?: boolean;
}

/**
 * Guarantees default user role and baseline subscription tier.
 */
export const syncDefaultRole = async (
  userId: string | mongoose.Types.ObjectId,
  options: ISyncOptions = {},
): Promise<void> => {
  const { session, skipCheck = false } = options;
  const targetUserId =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;
  const targetUserIdStr = targetUserId.toString();

  let hasRole = false;
  let hasSubscription = false;

  // Skip query lookups for fresh account registrations
  if (!skipCheck) {
    const [existingRole, existingSubscription] = await Promise.all([
      UserRoleModel.findOne({
        userId: targetUserId,
        effectiveTo: null,
      })
        .session(session || null)
        .lean(),
      SubscriptionService.getByUserId(targetUserIdStr),
    ]);

    hasRole = Boolean(existingRole);
    hasSubscription = Boolean(existingSubscription);

    if (hasRole && hasSubscription) {
      return;
    }
  }

  const isExternalSession = Boolean(session);
  const activeSession = session || (await mongoose.startSession());

  if (!isExternalSession) {
    activeSession.startTransaction();
  }

  try {
    if (!hasRole) {
      await assignUserRole({
        userId: targetUserId,
        roleName: ROLES.COMMUNITY.USER,
        reason: skipCheck
          ? "Initial user onboarding role assignment"
          : "Backfilled default role",
        session: activeSession,
      });
    }

    if (!hasSubscription) {
      await SubscriptionService.createSubscription({
        userId: targetUserIdStr,
        tier: "FREE",
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        session: activeSession,
      });
    }

    if (!isExternalSession) {
      await activeSession.commitTransaction();
    }
  } catch (error) {
    if (!isExternalSession) {
      await activeSession.abortTransaction();
    }
    throw error;
  } finally {
    if (!isExternalSession) {
      activeSession.endSession();
    }
  }
};
