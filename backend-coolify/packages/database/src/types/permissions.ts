import { Document } from "mongoose";
import { PermissionName } from "./authorize";

export interface IPermission {
  _id: string;
  name: PermissionName; // e.g., "post.create", "admin.users.view"
  resource: string; // e.g., "post", "admin.users"
  action: string; // e.g., "create", "view"
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPermissionDocument
  extends Omit<IPermission, "_id" | "createdAt" | "updatedAt">, Document {
  createdAt: Date;
  updatedAt: Date;
}
