import { Response, NextFunction } from "express";
import { createS3Service } from "../../services/s3";
import { ALLOWED_MIME_TYPES, AllowedMimeType } from "../../constants/others";
import { IAuthRequest, IS3Config } from "../../types";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { forwardError } from "../../utils/misc/error";

interface PolicyRequestBody {
  fileType: AllowedMimeType;
}

interface UrlRequestBody {
  fileType?: AllowedMimeType;
  fileKey?: string;
}

interface InitMultipartRequestBody {
  fileType: AllowedMimeType;
}

interface SignPartRequestBody {
  uploadId: string;
  fileKey: string;
  partNumber: number;
}

interface CompleteMultipartRequestBody {
  uploadId: string;
  fileKey: string;
  parts: { ETag: string; PartNumber: number }[];
}

/**
 * Express middleware handler routing standard secure POST policy signatures.
 */
export const MediaUploadPolicyHandler = (s3Config: IS3Config) => {
  const s3Service = createS3Service(s3Config);

  return async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { fileType } = req.body as PolicyRequestBody;
    const userId = req.user?.id;

    if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType)) {
      res.status(400).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.UPLOAD.INVALID_OR_MISSING_FILE_TYPE,
        payload: null,
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
        payload: null,
      });
      return;
    }

    try {
      const { uploadUrl, fields, fileKey } =
        await s3Service.generateS3PostPolicy(userId, fileType);
      const publicUrl = s3Service.getPublicUrl(fileKey);

      res.status(200).json({
        status: "SUCCESS",
        ...MESSAGES_REGISTRY.UPLOAD.PRE_SIGNED_POST_POLICY_SUCCESS,
        payload: { uploadUrl, fields, fileKey, publicUrl },
      });
    } catch (error: any) {
      console.error("S3 Presign Policy Error:", error);

      return forwardError(
        next,
        error.message
          ? MESSAGES_REGISTRY.UPLOAD.PRE_SIGNED_POST_POLICY_THROWN_ERROR(
              error.message,
            )
          : MESSAGES_REGISTRY.SYSTEM.INTERNAL_SERVER_ERROR,
        error,
      );
    }
  };
};

/**
 * Express middleware handler routing raw pre-signed PUT URLs for multipart chunk completion fallbacks.
 */
export const MediaUploadUrlHandler = (s3Config: IS3Config) => {
  const s3Service = createS3Service(s3Config);

  return async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { fileType, fileKey: requestedFileKey } = req.body as UrlRequestBody;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
        payload: null,
      });
      return;
    }

    try {
      if (requestedFileKey) {
        const publicUrl = s3Service.getPublicUrl(requestedFileKey);
        res.status(200).json({
          status: "SUCCESS",
          ...MESSAGES_REGISTRY.UPLOAD.PUBLIC_DELIVERY_LINK_RESOLVED,
          payload: { uploadUrl: "", fileKey: requestedFileKey, publicUrl },
        });
        return;
      }

      if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType)) {
        res.status(400).json({
          status: "ERROR",
          ...MESSAGES_REGISTRY.UPLOAD.INVALID_OR_MISSING_FILE_TYPE,
          payload: null,
        });
        return;
      }

      const { url, fileKey } = await s3Service.generateS3Url(userId, fileType);
      const publicUrl = s3Service.getPublicUrl(fileKey);

      res.status(200).json({
        status: "SUCCESS",
        ...MESSAGES_REGISTRY.UPLOAD.PRE_SIGNED_URL_SUCCESS,
        payload: { uploadUrl: url, fileKey, publicUrl },
      });
    } catch (error: any) {
      console.error("S3 Presign PUT URL Error:", error);

      return forwardError(
        next,
        error.message
          ? MESSAGES_REGISTRY.UPLOAD.PRE_SIGNED_URL_THROWN_ERROR(error.message)
          : MESSAGES_REGISTRY.SYSTEM.INTERNAL_SERVER_ERROR,
        error,
      );
    }
  };
};

/**
 * Initializes a chunked multi-part processing session matrix context.
 */
export const InitMultipartHandler = (s3Config: IS3Config) => {
  const s3Service = createS3Service(s3Config);

  return async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { fileType } = req.body as InitMultipartRequestBody;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
        payload: null,
      });
      return;
    }

    try {
      const { uploadId, fileKey } = await s3Service.initMultipartUpload(
        userId,
        fileType,
      );

      res.status(200).json({
        status: "SUCCESS",
        ...MESSAGES_REGISTRY.UPLOAD.MULTIPART_SESSION_INITIALIZED,
        payload: { uploadId, fileKey },
      });
    } catch (error: any) {
      console.error("Init Multipart Error:", error);

      return forwardError(
        next,
        error.message
          ? MESSAGES_REGISTRY.UPLOAD.MULTIPART_SESSION_THROWN_ERROR(
              error.message,
            )
          : MESSAGES_REGISTRY.SYSTEM.INTERNAL_SERVER_ERROR,
        error,
      );
    }
  };
};

/**
 * Signs an isolated byte track index partition.
 */
export const SignPartHandler = (s3Config: IS3Config) => {
  const s3Service = createS3Service(s3Config);

  return async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { uploadId, fileKey, partNumber } = req.body as SignPartRequestBody;

    try {
      const { partUploadUrl } = await s3Service.signMultipartPart(
        uploadId,
        fileKey,
        partNumber,
      );

      res.status(200).json({
        status: "SUCCESS",
        ...MESSAGES_REGISTRY.UPLOAD.PART_SEGMENT_LINK_GENERATED,
        payload: { partUploadUrl },
      });
    } catch (error: any) {
      console.error("Sign Part Error:", error);

      return forwardError(
        next,
        error.message
          ? MESSAGES_REGISTRY.UPLOAD.PART_SEGMENT_LINK_THROWN_ERROR(
              error.message,
            )
          : MESSAGES_REGISTRY.SYSTEM.INTERNAL_SERVER_ERROR,
        error,
      );
    }
  };
};

/**
 * Assembles all verified segmented chunks together at the network perimeter.
 */
export const CompleteMultipartHandler = (s3Config: IS3Config) => {
  const s3Service = createS3Service(s3Config);

  return async (
    req: IAuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { uploadId, fileKey, parts } =
      req.body as CompleteMultipartRequestBody;

    try {
      await s3Service.completeMultipartUpload(uploadId, fileKey, parts);

      res.status(200).json({
        status: "SUCCESS",
        ...MESSAGES_REGISTRY.UPLOAD.MULTIPART_ASSET_ASSEMBLED,
        payload: null,
      });
    } catch (error: any) {
      console.error("Complete Multipart Error:", error);

      return forwardError(
        next,
        error.message
          ? MESSAGES_REGISTRY.UPLOAD.MULTIPART_ASSET_ASSEMBLED_THROWN_ERROR(
              error.message,
            )
          : MESSAGES_REGISTRY.SYSTEM.INTERNAL_SERVER_ERROR,
        error,
      );
    }
  };
};
