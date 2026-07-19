import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { initiatePhoneChange } from "@/profile/phone/services/verifyChange";

interface UserPhoneRequest extends IAuthRequest {
  body: {
    newPhoneNumber: string;
  };
}

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

/**
 * Controller endpoint to handle user profile identifier telephone transformation procedures.
 */
export const changePhoneNumber = async (
  req: UserPhoneRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const { newPhoneNumber } = req.body;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  if (!newPhoneNumber || !phoneRegex.test(newPhoneNumber)) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.INVALID_PHONE,
      payload: null,
    });
  }

  try {
    const serviceResult = await initiatePhoneChange({
      userId,
      newPhoneNumber,
    });

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "PHONE_ALREADY_USED") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (
      serviceResult.status === "COOLDOWN_ACTIVE" ||
      serviceResult.status === "RATE_LIMIT_ACTIVE"
    ) {
      return res.status(429).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "PHONE_CONFLICT") {
      return res.status(409).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Change Phone Error:", error);
    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.AUTH.SERVER_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
