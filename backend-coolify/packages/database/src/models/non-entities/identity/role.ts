import { Schema, model, Model } from "mongoose";
import { IRoleDocument, IUserRoleDocument } from "../../../types/role";
import { COMMUNITY_ROLES, PLATFORM_ROLES } from "../../../constants/roles";

const allRoleNames = [
  ...Object.values(PLATFORM_ROLES),
  ...Object.values(COMMUNITY_ROLES),
];

const RoleSchema = new Schema<IRoleDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: allRoleNames,
      index: true,
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
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);
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
      index: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // Can be null if system-assigned or self-assigned upon signup
      default: null,
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
      default: null, // Null means permanent
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Ensure unique combination of userId and roleId, but only for currently active roles
UserRoleSchema.index(
  { userId: 1, roleId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      effectiveTo: { $exists: false }, // Only apply uniqueness to active roles
    },
  },
);

export const UserRoleModel: Model<IUserRoleDocument> = model<IUserRoleDocument>(
  "UserRole",
  UserRoleSchema,
  "user_roles",
);
