import {
  RoleModel,
  UserRoleModel,
  RoleName,
  PlatformRole,
} from "@repo/database";
import { createDomainError, MESSAGES_REGISTRY } from "@repo/shared";
import mongoose, { Types } from "mongoose";

interface IAssignRoleParams {
  userId: string | Types.ObjectId;
  roleName: RoleName;
  assignedBy?: string | Types.ObjectId | null;
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
        assignmentReason: reason,
        effectiveFrom: new Date(),
        effectiveTo: null,
      },
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
    reason,
  });
};
