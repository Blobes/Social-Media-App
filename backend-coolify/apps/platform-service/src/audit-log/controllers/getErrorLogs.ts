import { Response } from "express";
import { IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { executeErrorLogsFetch } from "@repo/security";
import { ErrorLogModel } from "@repo/database";

/**
 * Controller endpoint to pull system diagnostic indexes under administrative constraints.
 */
export const getErrorLogs = async (
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const statusCode = req.query.statusCode
      ? parseInt(req.query.statusCode as string)
      : undefined;
    const errorCode = req.query.errorCode as string | undefined;

    const serviceResult = await executeErrorLogsFetch({
      ErrorLogModel,
      page,
      limit,
      statusCode,
      errorCode,
    });

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
      meta: {
        page,
        limit,
        count: serviceResult.payload.length,
      },
    });
  } catch (error: any) {
    console.error("Get Error Logs Controller Failed:", error);
    return res.status(500).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.SYSTEM.FETCH_ERROR_LOGS_FAILED,
      payload: null,
    });
  }
};
