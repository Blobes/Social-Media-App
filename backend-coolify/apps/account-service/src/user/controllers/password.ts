import { NextFunction, Response } from "express";
import {
  IAuthRequest,
  MESSAGES_REGISTRY,
  clearAuthCookies,
  forwardError,
} from "@repo/shared";
import { executePasswordUpdate, PasswordPurpose } from "../services/password";

interface PassWordRequest extends IAuthRequest {
  body: {
    purpose: PasswordPurpose;
    currentPassword?: string;
    newPassword: string;
  };
}

/**
 * Controller endpoint to handle credential provisioning and security rotation strategies.
 */
export const setPassword = async (
  req: PassWordRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const jwtDeviceId = req.user?.deviceId;
  const { purpose, currentPassword, newPassword } = req.body;

  if (!userId || !jwtDeviceId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  if (!purpose || !["CREATE_PASSWORD", "CHANGE_PASSWORD"].includes(purpose)) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.INVALID_PASSWORD_PURPOSE,
      payload: null,
    });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.INVALID_NEW_PASSWORD,
      payload: null,
    });
  }

  if (purpose === "CHANGE_PASSWORD" && !currentPassword) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.CURRENT_PASSWORD_REQUIRED,
      payload: null,
    });
  }

  try {
    const serviceResult = await executePasswordUpdate({
      userId,
      jwtDeviceId,
      purpose,
      newPassword,
      currentPassword,
    });

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (
      serviceResult.status === "PASSWORD_ALREADY_EXISTS" ||
      serviceResult.status === "NO_PASSWORD_SET" ||
      serviceResult.status === "PASSWORD_REUSE_FORBIDDEN"
    ) {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "INCORRECT_CURRENT_PASSWORD") {
      return res.status(401).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    // Flush runtime tracking vectors if transaction forced cookie revocation requirements
    if (serviceResult.payload?.loggedOut) {
      clearAuthCookies(res);
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Change Password Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.PASSWORD_UPDATE_ERROR,
      error,
    );
  }
};
