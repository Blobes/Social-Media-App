import { Types, Document } from "mongoose";
import {
  ADMIN_PERMISSIONS,
  ADS_PERMISSIONS,
  COMMENT_PERMISSIONS,
  DEVICE_PERMISSIONS,
  PERMISSIONS,
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
export type RoleName = PlatformRole | CommunityRole;

export type DevicePermission =
  (typeof DEVICE_PERMISSIONS)[keyof typeof DEVICE_PERMISSIONS];
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

export type PermissionName = {
  [K in keyof typeof PERMISSIONS]: (typeof PERMISSIONS)[K][keyof (typeof PERMISSIONS)[K]];
}[keyof typeof PERMISSIONS];

export interface IRole {
  _id: string;
  name: RoleName;
  category: RoleCategory;
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
  name: PermissionName; // e.g., "device.read", "post.create", "admin.users.view"
  resource: string; // e.g., "device", "post", "admin.users"
  action: string; // e.g., "read", "create", "view"
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

export type SubjectType = "user" | "group";
export type RelationType =
  | "owner"
  | "editor"
  | "viewer"
  | "follower"
  | "blocked";
export type ObjectType = "user" | "post" | "comment" | "device";

export interface IRelationTuple {
  _id: string;
  subjectType: SubjectType;
  subjectId: string;
  relation: RelationType;
  objectType: ObjectType;
  objectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRelationTupleDocument
  extends Omit<IRelationTuple, "_id" | "createdAt" | "updatedAt">, Document {
  createdAt: Date;
  updatedAt: Date;
}
