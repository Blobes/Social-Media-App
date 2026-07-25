import { s3Config } from "@/envVars";
import {
  ALLOWED_MIME_TYPES,
  AllowedMimeType,
  createS3Service,
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { Response, NextFunction } from "express";

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
export const MediaUploadPolicyHandler = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { fileType } = req.body as PolicyRequestBody;
  const s3Service = createS3Service(s3Config);
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
    const { uploadUrl, fields, fileKey } = await s3Service.generateS3PostPolicy(
      userId,
      fileType,
    );
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
      MESSAGES_REGISTRY.UPLOAD.PRE_SIGNED_POST_POLICY_THROWN_ERROR,
      error,
    );
  }
};

/**
 * Express middleware handler routing raw pre-signed PUT URLs for multipart chunk completion fallbacks.
 */
export const MediaUploadUrlHandler = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const s3Service = createS3Service(s3Config);

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
      MESSAGES_REGISTRY.UPLOAD.PRE_SIGNED_URL_THROWN_ERROR,
      error,
    );
  }
};

/**
 * Initializes a chunked multi-part processing session matrix context.
 */
export const InitMultipartHandler = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { fileType } = req.body as InitMultipartRequestBody;
  const userId = req.user?.id;
  const s3Service = createS3Service(s3Config);

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
      MESSAGES_REGISTRY.UPLOAD.MULTIPART_SESSION_THROWN_ERROR,
      error,
    );
  }
};

/**
 * Signs an isolated byte track index partition.
 */
export const SignPartHandler = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { uploadId, fileKey, partNumber } = req.body as SignPartRequestBody;
  const s3Service = createS3Service(s3Config);

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
      MESSAGES_REGISTRY.UPLOAD.PART_SEGMENT_LINK_THROWN_ERROR,
      error,
    );
  }
};

/**
 * Assembles all verified segmented chunks together at the network perimeter.
 */
export const CompleteMultipartHandler = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const s3Service = createS3Service(s3Config);

  const { uploadId, fileKey, parts } = req.body as CompleteMultipartRequestBody;

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
      MESSAGES_REGISTRY.UPLOAD.MULTIPART_ASSET_ASSEMBLED_THROWN_ERROR,
      error,
    );
  }
};
