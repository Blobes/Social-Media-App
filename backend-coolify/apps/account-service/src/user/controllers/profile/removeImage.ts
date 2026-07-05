import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import {
  executeUserImageRemoval,
  RemoveImageType,
} from "@/user/services/profile/image";

interface RemoveRequest extends IAuthRequest {
  body: {
    imageType: RemoveImageType;
  };
}

/**
 * Controller endpoint to sever image asset references linked to user document parameters.
 */
export const removeUserImage = async (
  req: RemoveRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const authUserId = req.user?.id;
  const { imageType } = req.body;

  if (!authUserId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  if (imageType !== "PROFILE" && imageType !== "COVER") {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.PROFILE.INVALID_IMAGE_TYPE,
      payload: null,
    });
  }

  try {
    const serviceResult = await executeUserImageRemoval({
      authUserId,
      imageType,
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
    });
  } catch (error: any) {
    console.error("Soft Delete Media Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.PROFILE.IMAGE_REMOVAL_ERROR,
      error,
    );
  }
};
