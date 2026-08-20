import { IUserDocument } from "@repo/database";
import {
  syncIdentifierStatus,
  authorizeDeviceTrust,
  commitIdentifierChange,
  finalizePasswordReset,
  guardIdentifierPending,
} from "./otpHandlers";
import { OtpMessageChannel, OtpIdentifierType } from "@repo/shared";

export type Lifecycle = "DISPATCH_REQUEST" | "VERIFICATION";

export interface IWorkflowContext {
  userAgent: string;
  deviceToken: string;
  recipient: string;
  channelType?: OtpMessageChannel;
  recipientType?: OtpIdentifierType;
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
  ) => Promise<unknown>
> = {
  LOGIN_VERIFICATION: async (user, context, lifecycle = "VERIFICATION") => {
    if (lifecycle === "DISPATCH_REQUEST") return null;
    await authorizeDeviceTrust(user, context.deviceToken, context.userAgent);
    return await syncIdentifierStatus(user, context.recipientType);
  },
  SIGNUP_VERIFICATION: async (user, context, lifecycle = "VERIFICATION") => {
    if (lifecycle === "DISPATCH_REQUEST") return null;
    await authorizeDeviceTrust(user, context.deviceToken, context.userAgent);
    return await syncIdentifierStatus(user, context.recipientType);
  },
  IDENTIFIER_UPDATE: async (user, context, lifecycle = "VERIFICATION") => {
    if (lifecycle === "VERIFICATION") {
      return await commitIdentifierChange(user, context.recipientType);
    }
    guardIdentifierPending(user, context.recipientType);
    return null;
  },
  PASSWORD_RESET_VERIFICATION: async (
    user,
    context,
    lifecycle = "VERIFICATION",
  ) => {
    if (lifecycle === "DISPATCH_REQUEST") return null;
    return await finalizePasswordReset(user, context.recipientType);
  },
  MFA_ACTIVATION: async (
    user,
    context,
    lifecycle = "VERIFICATION",
  ) => {
    if (lifecycle === "DISPATCH_REQUEST" || user.hasEnabledMFA === true) return null;
    user.hasEnabledMFA = true
    return await finalizePasswordReset(user, context.recipientType);
  },
};
