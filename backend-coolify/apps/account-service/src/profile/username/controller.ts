import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { executeUsernameChange } from "@/profile/username/service";

/**
 * Controller endpoint to handle user profile identifier tag mutations.
 */
export const changeUsername = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { newUsername, password } = req.body as {
    newUsername?: string;
    password?: string;
  };

  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const serviceResult = await executeUsernameChange({
      userId,
      newUsername,
      password,
    });

    if (serviceResult.status === "INVALID_USERNAME") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (
      serviceResult.status === "PASSWORD_REQUIRED" ||
      serviceResult.status === "NO_PASSWORD_SET"
    ) {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "INCORRECT_PASSWORD") {
      return res.status(401).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "COOLDOWN_ACTIVE") {
      return res.status(403).json({
        status: "ERROR",
        ...serviceResult.transInfo,
      });
    }

    if (serviceResult.status === "USERNAME_TAKEN") {
      return res.status(409).json({
        status: "ERROR",
        ...serviceResult.transInfo,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Change Username Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
