import { Response } from "express";
import mongoose from "mongoose";
import { IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { executeUserLogsFetch } from "@repo/security";
import { UserLogModel } from "@repo/database";

/**
 * Controller endpoint to pull account history logs with contextual timeline boundaries.
 */
export const getUserLogs = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const targetUserId = req.params.id as string;
  const authUserId = req.user?.id;
  const userRole = req.user?.role;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.PROFILE.INVALID_ID_FORMAT,
      payload: null,
    });
  }

  // Restrict ledger visibility to account owner or administrative staff
  if (targetUserId !== authUserId && userRole !== "ADMIN") {
    return res.status(403).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.FORBIDDEN,
      payload: null,
    });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string | undefined;

    const serviceResult = await executeUserLogsFetch({
      UserLogModel,
      userId: targetUserId,
      page,
      limit,
      category,
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
    console.error("Get User Logs Error:", error);
    return res.status(500).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.PROFILE.FETCH_USER_LOGS_ERROR,
      payload: null,
    });
  }
};
