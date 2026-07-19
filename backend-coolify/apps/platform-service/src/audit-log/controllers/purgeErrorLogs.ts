import { Response } from "express";
import { IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { executeErrorLogsPurge } from "@repo/security";
import { ErrorLogModel } from "@repo/database";

/**
 * Controller endpoint to truncate collected trace entries manually before structural automated schema TTL policies fire.
 */
export const purgeErrorLogs = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const userRole = req.user?.role;

  if (userRole !== "ADMIN") {
    return res.status(403).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.FORBIDDEN,
      payload: null,
    });
  }

  try {
    const statusCode = req.body.statusCode
      ? parseInt(req.body.statusCode as string)
      : undefined;

    const serviceResult = await executeErrorLogsPurge({
      ErrorLogModel,
      statusCode,
    });

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: null,
    });
  } catch (error: any) {
    console.error("Purge Error Logs Controller Failed:", error);
    return res.status(500).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.SYSTEM.PURGE_ERROR_LOGS_FAILED,
      payload: null,
    });
  }
};
