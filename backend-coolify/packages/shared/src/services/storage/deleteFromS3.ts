import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Initialize the S3 Client with your credentials
const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

/**
 * Deletes a single object from an S3 bucket
 * @param fileKey - The unique key/path of the file in the bucket
 */
export const deleteFromS3 = async (fileKey: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: fileKey,
    });

    await s3Client.send(command);
    console.log(`Successfully deleted ${fileKey} from S3`);
  } catch (error: any) {
    console.error("AWS S3 Deletion Error:", error);
    // We throw the error so the controller transaction can handle it if necessary
    throw new Error(`Cloud storage deletion failed: ${error.message}`);
  }
};
