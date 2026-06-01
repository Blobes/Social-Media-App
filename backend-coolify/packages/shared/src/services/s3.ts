import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { v4 as uuidv4 } from "uuid";
import {
  ALLOWED_MIME_TYPES,
  AllowedMimeType,
  MAX_FILE_SIZE_BYTES,
  MIME_TO_EXTENSION,
} from "../utils/misc/constants";
import { IS3Config } from "../types";

/**
 * Creates an instance of the cloud storage service mapped to Cloudflare R2 infrastructure.
 */
export const createS3Service = (config: IS3Config) => {
  const s3 = new S3Client({
    region: config.REGION,
    endpoint: config.ENDPOINT_URL,
    credentials: {
      accessKeyId: config.ACCESS_KEY_ID,
      secretAccessKey: config.SECRET_ACCESS_KEY,
    },
  });

  /**
   * Generates a unique, standardized object key path for storage.
   */
  const generateFileKey = (
    userId: string,
    fileType: AllowedMimeType,
  ): string => {
    const extension = MIME_TO_EXTENSION[fileType] || "bin";
    return `uploads/${userId}/${Date.now()}-${uuidv4()}.${extension}`;
  };

  /**
   * Generates a pre-signed POST policy enforcing exact mime types and size caps at the cloud edge.
   */
  const generateS3PostPolicy = async (
    userId: string,
    fileType: AllowedMimeType,
  ) => {
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      throw new Error("Requested file format is blocked by storage policies.");
    }

    const fileKey = generateFileKey(userId, fileType);

    const { url, fields } = await createPresignedPost(s3, {
      Bucket: config.BUCKET_NAME,
      Key: fileKey,
      Expires: 60 * 5, // 5 minutes
      Fields: {
        "content-type": fileType,
        "x-amz-meta-uploader-id": userId,
      },
      Conditions: [
        ["eq", "$bucket", config.BUCKET_NAME],
        ["eq", "$content-type", fileType],
        ["content-length-range", 0, MAX_FILE_SIZE_BYTES],
      ],
    });

    return { uploadUrl: url, fields, fileKey };
  };

  /**
   * Generates a standalone pre-signed PUT URL for fallbacks or custom tracking.
   */
  const generateS3Url = async (userId: string, fileType: AllowedMimeType) => {
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      throw new Error("Requested file format is blocked by storage policies.");
    }

    const fileKey = generateFileKey(userId, fileType);

    const command = new PutObjectCommand({
      Bucket: config.BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
      Metadata: {
        "uploader-id": userId,
        "original-mime-type": fileType,
      },
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 60 });
    return { url, fileKey };
  };

  /**
   * Initializes a native multipart upload session on the cloud bucket container.
   */
  const initMultipartUpload = async (
    userId: string,
    fileType: AllowedMimeType,
  ) => {
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      throw new Error("Requested file format is blocked by storage policies.");
    }

    const fileKey = generateFileKey(userId, fileType);

    const command = new CreateMultipartUploadCommand({
      Bucket: config.BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
      Metadata: {
        "uploader-id": userId,
      },
    });

    const response = await s3.send(command);

    return {
      uploadId: response.UploadId,
      fileKey,
    };
  };

  /**
   * Generates a targeted pre-signed PUT chunk link for an isolated byte segment index.
   */
  const signMultipartPart = async (
    uploadId: string,
    fileKey: string,
    partNumber: number,
  ) => {
    const command = new UploadPartCommand({
      Bucket: config.BUCKET_NAME,
      Key: fileKey,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    const partUploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    return { partUploadUrl };
  };

  /**
   * Assembles all verified uploaded segmented chunks together at the network boundary.
   */
  const completeMultipartUpload = async (
    uploadId: string,
    fileKey: string,
    parts: { ETag: string; PartNumber: number }[],
  ) => {
    const sortedParts = parts.sort((a, b) => a.PartNumber - b.PartNumber);

    const command = new CompleteMultipartUploadCommand({
      Bucket: config.BUCKET_NAME,
      Key: fileKey,
      UploadId: uploadId,
      MultipartUpload: { Parts: sortedParts },
    });

    await s3.send(command);
  };

  /**
   * Removes an asset reference object from the active cloud storage bucket container.
   */
  const deleteFromS3 = async (fileKey: string): Promise<void> => {
    try {
      const command = new DeleteObjectCommand({
        Bucket: config.BUCKET_NAME,
        Key: fileKey,
      });
      await s3.send(command);
    } catch (error: any) {
      console.error("Cloud storage R2 Deletion Error:", error);
      throw new Error(`Cloud storage deletion failed: ${error.message}`);
    }
  };

  /**
   * Constructs an absolute public CDN delivery path matching a target file key mapping.
   */
  const getPublicUrl = (fileKey: string): string => {
    return `${config.PUBLIC_URL}/${fileKey}`;
  };

  return {
    client: s3,
    generateS3Url,
    generateS3PostPolicy,
    initMultipartUpload,
    signMultipartPart,
    completeMultipartUpload,
    deleteFromS3,
    getPublicUrl,
  };
};
