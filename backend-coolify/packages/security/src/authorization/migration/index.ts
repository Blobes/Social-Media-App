import {
  backfillExistingUserRoles,
  seedRolesAndPermissions,
} from "./fillRoles";
import { backfillExistingUserSubscriptions } from "./subscriptions";

/**
 * Runs complete system startup migrations, role seeding, and user baseline backfills.
 */
export const initializeDBAuthorization = async (): Promise<void> => {
  await seedRolesAndPermissions();
  await backfillExistingUserRoles();
  await backfillExistingUserSubscriptions();
};

await initializeDBAuthorization();
