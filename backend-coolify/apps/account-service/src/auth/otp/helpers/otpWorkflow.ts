import { IUserDocument } from "@repo/database";
import {
  syncIdentifierStatus,
  authorizeDeviceTrust,
  commitIdentifierChange,
  finalizePasswordReset,
  guardIdentifierPending,
} from "./otpHandlers";
import { OtpType } from "@repo/shared";

export type Lifecycle = "DISPATCH_REQUEST" | "VERIFICATION";

export interface IWorkflowContext {
  userAgent: string;
  deviceToken: string;
  recipient: string;
  channel: OtpType;
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
    return await syncIdentifierStatus(user, context.channel);
  },
  SIGNUP_VERIFICATION: async (user, context, lifecycle = "VERIFICATION") => {
    if (lifecycle === "DISPATCH_REQUEST") return null;
    await authorizeDeviceTrust(user, context.deviceToken, context.userAgent);
    return await syncIdentifierStatus(user, context.channel);
  },
  IDENTIFIER_UPDATE: async (user, context, lifecycle = "VERIFICATION") => {
    if (lifecycle === "VERIFICATION") {
      return await commitIdentifierChange(user, context.channel);
    }
    guardIdentifierPending(user, context.channel);
    return null;
  },
  PASSWORD_RESET_VERIFICATION: async (
    user,
    context,
    lifecycle = "VERIFICATION",
  ) => {
    if (lifecycle === "DISPATCH_REQUEST") return null;
    return await finalizePasswordReset(user, context.channel);
  },
};
