import {
  backfillExistingUserRoles,
  seedRolesAndPermissions,
} from "./fillRoles";
import { backfillExistingUserSubscriptions } from "./subscriptions";

/**
 * Runs complete system startup migrations, role seeding, and user baseline backfills.
 */
export const syncDBAuthorization = async (): Promise<void> => {
  console.log("🌱 Seeding roles and permissions...");
  await seedRolesAndPermissions();
  console.log("✨ Roles and permissions synchronized.");

  console.log("👥 Backfilling user roles...");
  await backfillExistingUserRoles();
  console.log("✨ User roles verified and updated.");

  console.log("💳 Backfilling user subscriptions...");
  await backfillExistingUserSubscriptions();
  console.log("✨ User subscriptions verified and updated.");
};
