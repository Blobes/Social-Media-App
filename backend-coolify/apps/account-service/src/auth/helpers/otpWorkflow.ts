import { IUserDocument } from "@repo/database";
import {
  syncIdentifierStatus,
  authorizeDeviceTrust,
  commitIdentifierChange,
  finalizePasswordReset,
  guardIdentifierPending,
} from "./otpHandlers";

export type Lifecycle = "DISPATCH_REQUEST" | "VERIFICATION";

export interface IWorkflowContext {
  userAgent: string;
  deviceToken: string;
  recipient: string;
}

/**
 * Strategy registry mapping workflow contexts to specific account lifecycle state operations.
 */
export const otpWorkflowRegistry: Record<
  string,
  (
    user: IUserDocument,
    context: IWorkflowContext,
    lifecycle?: Lifecycle,
  ) => Promise<any>
> = {
  LOGIN_VERIFICATION: async (user, context, lifecycle = "VERIFICATION") => {
    if (lifecycle === "DISPATCH_REQUEST") return null;
    await authorizeDeviceTrust(user, context.deviceToken, context.userAgent);
    return await syncIdentifierStatus(user, context.recipient);
  },
  SIGNUP_VERIFICATION: async (user, context, lifecycle = "VERIFICATION") => {
    if (lifecycle === "DISPATCH_REQUEST") return null;
    await authorizeDeviceTrust(user, context.deviceToken, context.userAgent);
    return await syncIdentifierStatus(user, context.recipient);
  },
  IDENTIFIER_UPDATE: async (user, context, lifecycle = "VERIFICATION") => {
    if (lifecycle === "VERIFICATION") {
      return await commitIdentifierChange(user, context.recipient);
    }
    guardIdentifierPending(user, context.recipient);
    return null;
  },
  PASSWORD_RESET_VERIFICATION: async (
    user,
    context,
    lifecycle = "VERIFICATION",
  ) => {
    if (lifecycle === "DISPATCH_REQUEST") return null;
    return await finalizePasswordReset(user);
  },
};
