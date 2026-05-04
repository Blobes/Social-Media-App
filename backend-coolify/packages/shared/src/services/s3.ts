import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { MIME_TO_EXTENSION } from "../utils/misc/constants";
import { IS3Config } from "../types/types";

export const createS3Service = (config: IS3Config) => {
  /**
   * Single S3 client instance per service instance
   * No process.env usage here — fully injected config
   */
  const s3 = new S3Client({
    region: config.REGION,
    credentials: {
      accessKeyId: config.ACCESS_KEY_ID,
      secretAccessKey: config.SECRET_ACCESS_KEY,
    },
  });

  /**
   * Generate Pre-Signed Upload URL
   */
  const generateS3Url = async (userId: string, fileType: string) => {
    const extension = MIME_TO_EXTENSION[fileType] || "bin";
    const fileKey = `uploads/${userId}/${Date.now()}-${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: config.BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
      Metadata: {
        "uploader-id": userId,
        "original-mime-type": fileType,
      },
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 300 });

    return { url, fileKey };
  };

  /**
   * Delete File from S3
   */
  const deleteFromS3 = async (fileKey: string): Promise<void> => {
    try {
      const command = new DeleteObjectCommand({
        Bucket: config.BUCKET_NAME,
        Key: fileKey,
      });

      await s3.send(command);

      console.log(`Successfully deleted ${fileKey} from S3`);
    } catch (error: any) {
      console.error("AWS S3 Deletion Error:", error);

      throw new Error(`Cloud storage deletion failed: ${error.message}`);
    }
  };

  /**
   * Optional: Construct public URL (centralized)
   */
  const getPublicUrl = (fileKey: string) => {
    return `https://${config.BUCKET_NAME}.s3.${config.REGION}.amazonaws.com/${fileKey}`;
  };

  return {
    generateS3Url,
    deleteFromS3,
    getPublicUrl,
  };
};
