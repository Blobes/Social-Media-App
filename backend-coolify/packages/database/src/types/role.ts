import { Document } from "mongoose";
import { IRole, IRolePermission, IUserRole } from "./authorize";

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
