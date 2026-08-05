import { AccountStatus, ModerationDecision } from "@repo/database";
import { AppName, TransInfo } from "../types";
import { MESSAGES_REGISTRY } from "../constants/msgRegistry";

export const healthCheck = (serviceName: AppName) => {
  console.log(`${serviceName} is Live"`);
  return {
    status: "Ok",
    timestamp: new Date().toISOString(),
    service: serviceName,
  };
};

export const getAccountStatusMsg = (
  status: AccountStatus,
  mode: "RESTRICTED" | "NORMAL" = "NORMAL",
): {
  status: "ACCOUNT_ACTIVE" | "ACCOUNT_INACTIVE" | ModerationDecision;
  transInfo: TransInfo;
} => {
  if (mode === "RESTRICTED") {
    if (status === "DEACTIVATED") {
      return {
        status: "ACCOUNT_DEACTIVATED",
        transInfo: MESSAGES_REGISTRY.AUTH.ACCOUNT_DEACTIVATED,
      };
    }
    if (status === "SUSPENDED") {
      return {
        status: "ACCOUNT_SUSPENDED",
        transInfo: MESSAGES_REGISTRY.AUTH.ACCOUNT_SUSPENDED,
      };
    }
    if (status === "BANNED") {
      return {
        status: "ACCOUNT_BANNED",
        transInfo: MESSAGES_REGISTRY.AUTH.ACCOUNT_BANNED,
      };
    }
  }
  if (status === "INACTIVE") {
    return {
      status: "ACCOUNT_INACTIVE",
      transInfo: MESSAGES_REGISTRY.AUTH.ACCOUNT_INACTIVE,
    };
  }
  return {
    status: "ACCOUNT_ACTIVE",
    transInfo: MESSAGES_REGISTRY.AUTH.ACCOUNT_ACTIVE,
  };
};
