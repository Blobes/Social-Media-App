import { UserRoleModel, RoleName } from "@repo/database";
import { getCachedPermissionsForRoles } from "@repo/shared";
import { Types } from "mongoose";

/**
 * Resolves a user's active roles and composite permissions.
 */
export const getUserSecurityClaims = async (
  userId: string | Types.ObjectId,
) => {
  // 1. Fetch active assigned roles for user from DB
  const activeUserRoles = await UserRoleModel.find({
    userId,
    effectiveTo: null,
  }).populate<{ roleId: { _id: Types.ObjectId; name: RoleName } }>("roleId");

  const roleNames = activeUserRoles.map((ur) => ur.roleId.name);

  // 2. Delegate permission lookup to cached service
  const permissionSet = await getCachedPermissionsForRoles(roleNames);

  return {
    roles: roleNames,
    permissions: Array.from(permissionSet),
  };
};
