import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import {
  executeUserImageChange,
  UserImageType,
} from "@/user/services/profile/image";

interface ImageRequest {
  imageType: UserImageType;
  url: string;
  fileKey: string;
  mimeType?: string;
}

/**
 * Controller endpoint to ingest uploaded asset links and change target profile visual displays.
 */
export const changeUserImage = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { imageType, url, fileKey, mimeType } = req.body as ImageRequest;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
    return;
  }

  if (
    !url ||
    !fileKey ||
    !imageType ||
    !["PROFILE", "COVER"].includes(imageType)
  ) {
    res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.PROFILE.INVALID_IMAGE_PAYLOAD,
      payload: null,
    });
    return;
  }

  try {
    const serviceResult = await executeUserImageChange({
      userId,
      imageType,
      url,
      fileKey,
      mimeType,
    });

    if (serviceResult.status === "NOT_FOUND") {
      res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
      return;
    }

    res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
    return;
  } catch (error: any) {
    console.error(`Update ${imageType} Error:`, error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.PROFILE.IMAGE_UPDATE_ERROR,
      error,
    );
  }
};
