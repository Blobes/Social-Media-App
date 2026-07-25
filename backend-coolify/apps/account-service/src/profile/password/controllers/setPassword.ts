import { NextFunction, Response } from "express";
import { IAuthRequest, MESSAGES_REGISTRY, forwardError } from "@repo/shared";
import { executePasswordUpdate, PasswordPurpose } from "../services/executeSet";
import { clearAuthCookies } from "@repo/security";

interface PassWordRequest extends IAuthRequest {
  body: {
    purpose: PasswordPurpose;
    identifier?: string;
    currentPassword?: string;
    newPassword: string;
  };
}

/**
 * Controller endpoint to handle credential provisioning, security rotations, and unauthenticated password resets.
 */
export const setPassword = async (
  req: PassWordRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const jwtDeviceId = req.user?.deviceId;
  const { purpose, identifier, currentPassword, newPassword } = req.body;

  if (
    !purpose ||
    !["CREATE_PASSWORD", "CHANGE_PASSWORD", "PASSWORD_RESET"].includes(purpose)
  ) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.INVALID_PASSWORD_PURPOSE,
      payload: null,
    });
  }

  // Validate JWT for authenticated password set paths
  if (
    (purpose === "CREATE_PASSWORD" || purpose === "CHANGE_PASSWORD") &&
    (!userId || !jwtDeviceId)
  ) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  // Validate identifier for unauthenticated reset path
  if (purpose === "PASSWORD_RESET" && !identifier) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.EMAIL_OR_PHONE_REQUIRED,
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
      identifier,
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

    if (serviceResult.status === "RESTRICTION") {
      return res.status(403).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (
      serviceResult.status === "MISSING_IDENTIFIER" ||
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
    console.error("Set Password Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.PASSWORD_UPDATE_ERROR,
      error,
    );
  }
};
