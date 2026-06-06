import { IUserDocument } from "@repo/database";
import {
  getOrSetDeviceToken,
  setOtpChannel,
  VerificationPurpose,
} from "@repo/shared";
import { Request, Response } from "express";
import {
  syncIdentifierStatus,
  authorizeDeviceTrust,
  commitIdentifierChange,
  fulfillPasswordReset,
  guardIdentifierPending,
} from "./otpHandlers";

type Lifecycle = "DISPATCH_REQUEST" | "VERIFICATION";

// Define the action map for scalability
export const otpWorkflowRegistry: Record<
  VerificationPurpose,
  (
    user: IUserDocument,
    req: Request,
    res: Response,
    lifecycle?: Lifecycle,
  ) => Promise<any>
> = {
  LOGIN_VERIFICATION: async (user, req, res, lifecycle = "VERIFICATION") => {
    // Standard verification only; no specific pre-send validation required
    if (lifecycle === "DISPATCH_REQUEST") return null;
    const deviceToken = getOrSetDeviceToken(req, res);
    if (deviceToken) await authorizeDeviceTrust(user, deviceToken, req);
    return await syncIdentifierStatus(user, setOtpChannel(req.body.recipient)!);
  },
  SIGNUP_VERIFICATION: async (user, req, res, lifecycle = "VERIFICATION") => {
    // Standard verification only; no specific pre-send validation required
    if (lifecycle === "DISPATCH_REQUEST") return null;
    const deviceToken = getOrSetDeviceToken(req, res);
    if (deviceToken) await authorizeDeviceTrust(user, deviceToken, req);
    return await syncIdentifierStatus(user, setOtpChannel(req.body.recipient)!);
  },
  IDENTIFIER_UPDATE: async (user, req, res, lifecycle = "VERIFICATION") => {
    const channel = setOtpChannel(req.body.recipient)!;
    if (lifecycle === "VERIFICATION")
      return await commitIdentifierChange(user, channel);
    else guardIdentifierPending(user, channel);
  },
  PASSWORD_RESET: async (user, req, res, lifecycle = "VERIFICATION") => {
    if (lifecycle === "DISPATCH_REQUEST") return null;
    return await fulfillPasswordReset(user, req.body.newPassword, res);
  },
};
