import { NextFunction, Response } from "express";
import mongoose from "mongoose";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { executeFollowersFetch } from "../services/fetchFollowers";

/**
 * Controller endpoint to pull follower user profiles decorated with structural social graphs.
 */
export const getFollowers = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const targetUserId = req.params.id as string;
  const authUserId = req.user?.id;

  // Fail fast on invalid ID formats
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.PROFILE.INVALID_ID_FORMAT,
      payload: null,
    });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const serviceResult = await executeFollowersFetch({
      targetUserId,
      authUserId,
      page,
      limit,
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
    console.error("Get Followers Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.PROFILE.FOLLOWERS_FETCH_ERROR,
      error,
    );
  }
};
