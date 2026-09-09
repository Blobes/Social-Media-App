import {
  RoleModel,
  UserRoleModel,
  RoleName,
  PlatformRole,
  IUserRoleDocument,
} from "@repo/database";
import {
  createDomainError,
  MESSAGES_REGISTRY,
  getCachedPermissionsForRoles,
} from "@repo/shared";
import mongoose, { Types } from "mongoose";

interface IAssignRoleParams {
  userId: string | Types.ObjectId;
  roleName: RoleName;
  assignedBy?: string | Types.ObjectId | null;
  assignedByType?: "ADMIN" | "SYSTEM";
  reason?: string | null;
  session?: mongoose.ClientSession;
}

/**
 * Assigns a specific platform or community role to a user.
 */
export const assignUserRole = async ({
  userId,
  roleName,
  assignedBy = null,
  assignedByType = "SYSTEM",
  reason = null,
  session,
}: IAssignRoleParams): Promise<void> => {
  const role = await RoleModel.findOne({ name: roleName }).session(
    session ?? null,
  );
  if (!role) {
    const transMsg = MESSAGES_REGISTRY.SYSTEM.ROLE_NOT_FOUND(roleName);
    throw createDomainError(transMsg.message, transMsg.i18nKey, 400);
  }

  await UserRoleModel.updateOne(
    { userId, roleId: role._id, effectiveTo: null },
    {
      $setOnInsert: {
        userId,
        roleId: role._id,
        assignedBy,
        assignedByType,
        assignmentReason: reason,
        effectiveFrom: new Date(),
        effectiveTo: null,
      } as IUserRoleDocument,
    },
    { upsert: true, session },
  );
};

interface IGrantAdminAccessParams {
  targetUserId: string;
  adminUserId: string;
  platformRole: PlatformRole;
  reason: string;
}
/**
 * Grants platform administrative capabilities to a management account.
 */
export const grantManagementRole = async ({
  targetUserId,
  adminUserId,
  platformRole,
  reason,
}: IGrantAdminAccessParams): Promise<void> => {
  await assignUserRole({
    userId: targetUserId,
    roleName: platformRole,
    assignedBy: adminUserId,
    assignedByType: "ADMIN",
    reason,
  });
};

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
