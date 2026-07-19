import { Schema, model, Model } from "mongoose";
import { IPermissionDocument } from "../../../types/permissions";
import { IRolePermissionDocument } from "../../../types/role";
import {
  ADMIN_PERMISSIONS,
  ADS_PERMISSIONS,
  COMMENT_PERMISSIONS,
  POST_PERMISSIONS,
  REPORT_PERMISSIONS,
  USER_PERMISSIONS,
  WALLET_PERMISSIONS,
} from "../../../constants/permissions";

const allPermissionNames = [
  ...Object.values(POST_PERMISSIONS),
  ...Object.values(COMMENT_PERMISSIONS),
  ...Object.values(USER_PERMISSIONS),
  ...Object.values(ADMIN_PERMISSIONS),
  ...Object.values(REPORT_PERMISSIONS),
  ...Object.values(WALLET_PERMISSIONS),
  ...Object.values(ADS_PERMISSIONS),
];

const PermissionSchema = new Schema<IPermissionDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: allPermissionNames,
      index: true,
    },
    resource: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
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
export const PermissionModel: Model<IPermissionDocument> =
  model<IPermissionDocument>("Permission", PermissionSchema, "permissions");

// Role Permission
const RolePermissionSchema = new Schema<IRolePermissionDocument>(
  {
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },
    permissionId: {
      type: Schema.Types.ObjectId,
      ref: "Permission",
      required: true,
      index: true,
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

// Ensure unique combination of roleId and permissionId
RolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });

export const RolePermissionModel: Model<IRolePermissionDocument> =
  model<IRolePermissionDocument>(
    "RolePermission",
    RolePermissionSchema,
    "role_permissions",
  );
