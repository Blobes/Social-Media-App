import { NextFunction, Response } from "express";
import { IAuthRequest, MESSAGES_REGISTRY, forwardError } from "@repo/shared";
import { executePhoneChange } from "@/profile/phone/services/finalizeChange";
import { clearAuthCookies } from "@repo/security";

/**
 * Controller endpoint to confirm telephone authentication states and flush stale channels.
 */
export const finalizePhoneChange = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { code } = req.body;
  const userId = req.user?.id;
  const currentDeviceId = req.user?.deviceId;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  if (!code) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.CODE_REQUIRED,
      payload: null,
    });
  }

  try {
    const serviceResult = await executePhoneChange({
      userId,
      currentDeviceId,
      code,
    });

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (
      serviceResult.status === "EXPIRED" ||
      serviceResult.status === "INVALID_CODE"
    ) {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    // Terminate cookie lifetimes if transactional changes occur on non-primary links
    if (serviceResult.payload?.loggedOut) {
      clearAuthCookies(res);
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Verify Phone Error:", error);
    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.AUTH.SERVER_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
