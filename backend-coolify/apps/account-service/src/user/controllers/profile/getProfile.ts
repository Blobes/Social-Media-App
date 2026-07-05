import { NextFunction, Response } from "express";
import mongoose from "mongoose";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { executeUserProfileFetch } from "@/user/services/profile/info";

/**
 * Controller endpoint to pull profile records and decorate relational metadata properties.
 */
export const getUserProfile = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const targetUserId = req.params.id as string;
  const authUserId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.PROFILE.INVALID_ID_FORMAT,
      payload: null,
    });
  }

  try {
    const serviceResult = await executeUserProfileFetch({
      targetUserId,
      authUserId,
    });

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "DEACTIVATED") {
      return res.status(200).json({
        status: "DEACTIVATED",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Get User Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.PROFILE.FETCH_USER_ERROR,
      error,
    );
  }
};
