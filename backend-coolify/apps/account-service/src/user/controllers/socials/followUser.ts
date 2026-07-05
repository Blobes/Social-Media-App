import { NextFunction, Response } from "express";
import mongoose from "mongoose";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { toggleUserFollow } from "@/user/services/socials";

/**
 * Controller endpoint to handle following toggles and apply mutual context graphs.
 */
export const followUser = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const targetUserId = req.params.id as string;
  const currUserId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(targetUserId) || !currUserId) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.INVALID_ID_FORMAT,
    });
  }

  if (currUserId === targetUserId) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.PROFILE.CANNOT_FOLLOW_SELF,
    });
  }

  try {
    const serviceResult = await toggleUserFollow({
      currUserId,
      targetUserId,
    });

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
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
    console.error("Follow Action Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
