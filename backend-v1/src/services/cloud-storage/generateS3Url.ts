import { MIME_TO_EXTENSION } from "@/utils/constants";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

export const generateS3Url = async (userId: string, fileType: string) => {
  // Use the mapping for clean file names
  const extension = MIME_TO_EXTENSION[fileType] || "bin";
  const fileKey = `uploads/${userId}/${uuidv4()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
    Metadata: {
      "uploader-id": userId,
      "original-mime-type": fileType,
    },
  });

  // URL expires in 5 minutes
  const url = await getSignedUrl(s3, command, { expiresIn: 300 });

  return { url, fileKey };
};
