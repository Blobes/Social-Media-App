import { Response } from "express";
import {
  ALLOWED_MIME_TYPES,
  AllowedMimeType,
} from "../../utils/misc/constants";
import { IAuthRequest, IS3Config } from "../../types";
import { createS3Service } from "../../services/s3";

/**
 * Express middleware handler routing standard secure POST policy signatures.
 */
export const MediaUploadPolicyHandler = (s3Config: IS3Config) => {
  const s3Service = createS3Service(s3Config);

  return async (req: IAuthRequest, res: Response): Promise<void> => {
    const { fileType } = req.body as { fileType: AllowedMimeType };
    const userId = req.user?.id;

    if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType)) {
      res
        .status(400)
        .json({
          status: "ERROR",
          message: "Invalid or missing fileType parameter.",
          payload: null,
        });
      return;
    }

    if (!userId) {
      res
        .status(401)
        .json({ status: "ERROR", message: "Unauthorized.", payload: null });
      return;
    }

    try {
      const { uploadUrl, fields, fileKey } =
        await s3Service.generateS3PostPolicy(userId, fileType);
      const publicUrl = s3Service.getPublicUrl(fileKey);

      res.status(200).json({
        status: "SUCCESS",
        message: "Pre-signed POST policy generated successfully",
        payload: { uploadUrl, fields, fileKey, publicUrl },
      });
    } catch (error: any) {
      console.error("S3 Presign Policy Error:", error);
      res
        .status(500)
        .json({
          status: "ERROR",
          message: error.message || "Failed to generate policy",
          payload: null,
        });
    }
  };
};

/**
 * Express middleware handler routing raw pre-signed PUT URLs for multipart chunk completion fallbacks.
 */
export const MediaUploadUrlHandler = (s3Config: IS3Config) => {
  const s3Service = createS3Service(s3Config);

  return async (req: IAuthRequest, res: Response): Promise<void> => {
    const { fileType, fileKey: requestedFileKey } = req.body as {
      fileType?: AllowedMimeType;
      fileKey?: string;
    };
    const userId = req.user?.id;

    if (!userId) {
      res
        .status(401)
        .json({ status: "ERROR", message: "Unauthorized.", payload: null });
      return;
    }

    try {
      if (requestedFileKey) {
        const publicUrl = s3Service.getPublicUrl(requestedFileKey);
        res.status(200).json({
          status: "SUCCESS",
          message: "Public delivery link resolved successfully",
          payload: { uploadUrl: "", fileKey: requestedFileKey, publicUrl },
        });
        return;
      }

      if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType)) {
        res
          .status(400)
          .json({
            status: "ERROR",
            message: "Invalid or missing fileType parameter.",
            payload: null,
          });
        return;
      }

      const { url, fileKey } = await s3Service.generateS3Url(userId, fileType);
      const publicUrl = s3Service.getPublicUrl(fileKey);

      res.status(200).json({
        status: "SUCCESS",
        message: "Pre-signed URL generated successfully",
        payload: { uploadUrl: url, fileKey, publicUrl },
      });
    } catch (error: any) {
      console.error("S3 Presign PUT URL Error:", error);
      res
        .status(500)
        .json({
          status: "ERROR",
          message: error.message || "Failed to generate track url",
          payload: null,
        });
    }
  };
};

/**
 * Initializes a chunked multi-part processing session matrix context.
 */
export const InitMultipartHandler = (s3Config: IS3Config) => {
  const s3Service = createS3Service(s3Config);

  return async (req: IAuthRequest, res: Response): Promise<void> => {
    const { fileType } = req.body as { fileType: AllowedMimeType };
    const userId = req.user?.id;

    if (!userId) {
      res
        .status(401)
        .json({ status: "ERROR", message: "Unauthorized", payload: null });
      return;
    }

    try {
      const { uploadId, fileKey } = await s3Service.initMultipartUpload(
        userId,
        fileType,
      );

      res.status(200).json({
        status: "SUCCESS",
        message: "Multipart session initialized",
        payload: { uploadId, fileKey },
      });
    } catch (error: any) {
      console.error("Init Multipart Error:", error);
      res
        .status(500)
        .json({ status: "ERROR", message: error.message, payload: null });
    }
  };
};

/**
 * Signs an isolated byte track index partition.
 */
export const SignPartHandler = (s3Config: IS3Config) => {
  const s3Service = createS3Service(s3Config);

  return async (req: IAuthRequest, res: Response): Promise<void> => {
    const { uploadId, fileKey, partNumber } = req.body as {
      uploadId: string;
      fileKey: string;
      partNumber: number;
    };

    try {
      const { partUploadUrl } = await s3Service.signMultipartPart(
        uploadId,
        fileKey,
        partNumber,
      );

      res.status(200).json({
        status: "SUCCESS",
        message: "Part segment link generated",
        payload: { partUploadUrl },
      });
    } catch (error: any) {
      console.error("Sign Part Error:", error);
      res
        .status(500)
        .json({ status: "ERROR", message: error.message, payload: null });
    }
  };
};

/**
 * Assembles all verified segmented chunks together at the network perimeter.
 */
export const CompleteMultipartHandler = (s3Config: IS3Config) => {
  const s3Service = createS3Service(s3Config);

  return async (req: IAuthRequest, res: Response): Promise<void> => {
    const { uploadId, fileKey, parts } = req.body as {
      uploadId: string;
      fileKey: string;
      parts: { ETag: string; PartNumber: number }[];
    };

    try {
      await s3Service.completeMultipartUpload(uploadId, fileKey, parts);

      res.status(200).json({
        status: "SUCCESS",
        message: "Multipart asset successfully assembled",
        payload: null,
      });
    } catch (error: any) {
      console.error("Complete Multipart Error:", error);
      res
        .status(500)
        .json({ status: "ERROR", message: error.message, payload: null });
    }
  };
};
