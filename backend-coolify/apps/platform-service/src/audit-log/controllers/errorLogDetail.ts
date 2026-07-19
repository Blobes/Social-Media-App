import { Response } from "express";
import { IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { executeErrorLogDetailsFetch } from "@repo/security";
import { ErrorLogModel } from "@repo/database";

/**
 * Controller endpoint to resolve deep trace profiles by unique string identifiers or native keys.
 */
export const getErrorLogDetails = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const userRole = req.user?.role;
  const lookupTarget = req.params.idOrCode as string;

  if (userRole !== "ADMIN") {
    return res.status(403).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.FORBIDDEN,
      payload: null,
    });
  }

  try {
    const serviceResult = await executeErrorLogDetailsFetch(
      ErrorLogModel,
      lookupTarget,
    );

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
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
    console.error("Get Error Details Controller Failed:", error);
    return res.status(500).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.SYSTEM.FETCH_ERROR_LOGS_FAILED,
      payload: null,
    });
  }
};
