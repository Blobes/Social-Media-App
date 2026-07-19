import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { updateAccountBasicInfo } from "../services/updateBasic";

interface InfoRequest extends IAuthRequest {
  body: {
    firstName?: string;
    lastName?: string;
    about?: string;
    interests?: string[];
    website?: string;
    occupation?: string;
  };
}

/**
 * Controller endpoint to modify core identity parameters and evaluate authorization states.
 */
export const updateBasicInfo = async (
  req: InfoRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const authUserId = req.user?.id;
  const { firstName, lastName, about, interests, website, occupation } =
    req.body;

  if (!authUserId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const serviceResult = await updateAccountBasicInfo({
      authUserId,
      firstName,
      lastName,
      about,
      interests,
      website,
      occupation,
    });

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
      requiresIdVerification: serviceResult.requiresIdVerification,
    });
  } catch (error: any) {
    console.error("Update Info Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.PROFILE.UPDATE_INFO_ERROR,
      error,
    );
  }
};
