import { Types, Document } from "mongoose";
import {
  ADMIN_PERMISSIONS,
  ADS_PERMISSIONS,
  COMMENT_PERMISSIONS,
  POST_PERMISSIONS,
  REPORT_PERMISSIONS,
  USER_PERMISSIONS,
  WALLET_PERMISSIONS,
} from "../constants/permissions";
import { COMMUNITY_ROLES, PLATFORM_ROLES } from "../constants/roles";

export type RoleCategory = "PLATFORM" | "COMMUNITY";
export type PlatformRole = (typeof PLATFORM_ROLES)[keyof typeof PLATFORM_ROLES];
export type CommunityRole =
  (typeof COMMUNITY_ROLES)[keyof typeof COMMUNITY_ROLES];
export type RoleName = PlatformRole | CommunityRole; // All possible role names

export type AdminPermission =
  (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];
export type PostPermission =
  (typeof POST_PERMISSIONS)[keyof typeof POST_PERMISSIONS];
export type CommentPermission =
  (typeof COMMENT_PERMISSIONS)[keyof typeof COMMENT_PERMISSIONS];
export type UserPermission =
  (typeof USER_PERMISSIONS)[keyof typeof USER_PERMISSIONS];
export type ReportPermission =
  (typeof REPORT_PERMISSIONS)[keyof typeof REPORT_PERMISSIONS];
export type WalletPermission =
  (typeof WALLET_PERMISSIONS)[keyof typeof WALLET_PERMISSIONS];
export type AdsPermission =
  (typeof ADS_PERMISSIONS)[keyof typeof ADS_PERMISSIONS];

export type PermissionName = // All possible permission names
  | AdminPermission
  | PostPermission
  | CommentPermission
  | UserPermission
  | ReportPermission
  | WalletPermission
  | AdsPermission;

/**
 * Interface representing a user's identity and assigned roles for authorization checks.
 * This is the 'principal' that the AuthorizationService will operate on.
 */
export interface AuthorizationContext {
  userId: string;
  email: string;
  roleNames: RoleName[];
  // Any other context that might be needed for policy checks,
  // e.g., 'isAccountActive', 'isSelf', 'isCreator' etc.
  // It is populated by the Account Service.
  [key: string]: any;
}

/**
 * Interface for policies that determine if a user can perform an action on a resource.
 */
export interface AuthorizationPolicy {
  evaluate(
    context: AuthorizationContext,
    resource?: any,
  ): boolean | Promise<boolean>;
}

export interface IRole {
  _id: string;
  name: RoleName;
  category: RoleCategory; // e.g., "PLATFORM", "COMMUNITY"
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface IRolePermission {
  _id: string;
  roleId: Types.ObjectId;
  permissionId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export interface IUserRole {
  _id: string;
  userId: Types.ObjectId;
  roleId: Types.ObjectId;
  assignedBy?: Types.ObjectId | null; // Admin who assigned the role
  assignmentReason?: string;
  effectiveFrom: Date;
  effectiveTo?: Date | null; // For temporary roles
  createdAt: Date;
  updatedAt: Date;
}

export interface IPermission {
  _id: string;
  name: PermissionName; // e.g., "post.create", "admin.users.view"
  resource: string; // e.g., "post", "admin.users"
  action: string; // e.g., "create", "view"
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Role & Permission Documents
export interface IRoleDocument
  extends Omit<IRole, "_id" | "createdAt" | "updatedAt">, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IRolePermissionDocument
  extends Omit<IRolePermission, "_id" | "createdAt" | "updatedAt">, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserRoleDocument
  extends Omit<IUserRole, "_id" | "createdAt" | "updatedAt">, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IPermissionDocument
  extends Omit<IPermission, "_id" | "createdAt" | "updatedAt">, Document {
  createdAt: Date;
  updatedAt: Date;
}
