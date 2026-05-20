import { Response } from "express";
import {
  ALLOWED_MIME_TYPES,
  AllowedMimeType,
} from "../../utils/misc/constants";
import { IAuthRequest, IS3Config } from "../../types/types";
import { createS3Service } from "../../services/s3";
import { IMedia } from "@repo/database";

export const MediaUploadHandler = (s3Config: IS3Config) => {
  const s3Service = createS3Service(s3Config);

  return async (req: IAuthRequest, res: Response): Promise<void> => {
    const { fileType } = req.body as { fileType: string };
    const userId = req.user?.id;

    if (!fileType) {
      res.status(400).json({
        status: "ERROR",
        message: "fileType (mime type) is required.",
        payload: null,
      });
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(fileType as AllowedMimeType)) {
      res.status(400).json({
        status: "ERROR",
        message: `Unsupported file type. Supported: ${ALLOWED_MIME_TYPES.join(", ")}`,
        payload: null,
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        status: "ERROR",
        message: "Unauthorized: User ID not found.",
        payload: null,
      });
      return;
    }

    try {
      const { url, fileKey } = await s3Service.generateS3Url(userId, fileType);

      // ✅ Use config instead of process.env
      const publicUrl = `https://${s3Config.BUCKET_NAME}.s3.${s3Config.REGION}.amazonaws.com/${fileKey}`;

      res.status(200).json({
        status: "SUCCESS",
        message: "Pre-signed URL generated successfully",
        payload: {
          uploadUrl: url,
          fileKey,
          publicUrl,
        },
      });
    } catch (error: any) {
      console.error("S3 Presign Error:", error);

      res.status(500).json({
        status: "ERROR",
        message: error.message || "Failed to generate upload URL",
        payload: null,
      });
    }
  };
};
