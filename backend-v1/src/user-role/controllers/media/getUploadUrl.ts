import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import { generateS3Url } from "../../../services/cloud-storage/generateS3Url";
import { ALLOWED_MIME_TYPES, AllowedMimeType } from "@/utils/constants";

interface UploadUrlBody {
  fileType: string; //  "image/jpeg", "video/mp4", etc.
}

export const getUploadUrl = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  // Explicitly cast body for TS safety
  const { fileType } = req.body as UploadUrlBody;
  const userId = req.user?.id;

  // Validation: Check for required fields before calling S3
  if (!fileType) {
    res.status(400).json({
      status: "ERROR",
      message: "fileType (mime type) is required to generate an upload URL.",
      payload: null,
    });
    return;
  }

  //  Type guards to ensure fileType is valid
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
      message: "Unauthorized: User ID not found in token.",
      payload: null,
    });
    return;
  }

  try {
    // Call your service logic
    const { url, fileKey } = await generateS3Url(userId, fileType);

    /**
     * Construct Public URL.
     * Note: Modern S3 buckets often require the region in the hostname:
     * https://bucket-name.s3.region.amazonaws.com/file-key
     */
    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    res.status(200).json({
      message: "Pre-signed URL generated successfully",
      status: "SUCCESS",
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
      message: error.message || "Failed to generate upload signature.",
      payload: null,
    });
  }
};
