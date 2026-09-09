import { Model, Schema, model } from "mongoose";
import { COMMUNITY_ROLES, PLATFORM_ROLES } from "../../../constants/roles";
import { IRoleDocument, IUserRoleDocument } from "../../../types/authorization";

const allRoleNames = [
  ...Object.values(PLATFORM_ROLES),
  ...Object.values(COMMUNITY_ROLES),
];

const RoleSchema = new Schema<IRoleDocument>(
  {
    name: {
      type: String,
      required: true,
      enum: allRoleNames,
    },
    category: {
      type: String,
      required: true,
      enum: ["PLATFORM", "COMMUNITY"],
    },
    description: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Role Schema Indexes
RoleSchema.index({ name: 1 }, { unique: true });

/**
 * Model schema for managing system roles.
 */
export const RoleModel: Model<IRoleDocument> = model<IRoleDocument>(
  "Role",
  RoleSchema,
  "roles",
);

// User Role
const UserRoleSchema = new Schema<IUserRoleDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedByType: {
      type: String,
      required: true,
      enum: ["ADMIN", "SYSTEM"],
      default: "SYSTEM",
    },
    assignmentReason: {
      type: String,
      default: null,
    },
    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// User Role Schema Indexes
UserRoleSchema.index({ userId: 1 });
UserRoleSchema.index({ roleId: 1 });
UserRoleSchema.index(
  { userId: 1, roleId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      effectiveTo: null,
    },
  },
);

/**
 * Model schema for mapping user role assignments and durations.
 */
export const UserRoleModel: Model<IUserRoleDocument> = model<IUserRoleDocument>(
  "UserRole",
  UserRoleSchema,
  "user_roles",
);
