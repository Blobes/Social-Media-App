import { MediaModel } from "@repo/database";
import { Model } from "mongoose";
import { IS3Config } from "../../types";
import { createS3Service } from "../../services/s3";

interface HardDeleteOptions {
  mediaId?: string | any;
  rawFileKeys?: string[]; // New fallback flag for S3-only deletion paths
  parentModel?: Model<any>;
  parentId?: string;
  parentField?: string;
  s3Config: IS3Config;
}

/**
 * Utility to perform a hard delete:
 * 1. Deletes from Cloud S3 bucket (via DB record lookup or explicit raw keys)
 * 2. Deletes from Media Collection
 * 3. Nullifies reference in Parent Collection (Optional)
 */
export const hardDeleteMedia = async ({
  mediaId,
  rawFileKeys,
  parentModel,
  parentId,
  parentField,
  s3Config,
}: HardDeleteOptions): Promise<void> => {
  const s3Service = createS3Service(s3Config);

  // Path A: S3-Only Clean up (Useful during early finalizer rejections)
  if (rawFileKeys && rawFileKeys.length > 0) {
    await Promise.all(
      rawFileKeys.map(async (key) => {
        try {
          if (key) await s3Service.deleteFromS3(key);
        } catch (s3Error) {
          console.error(
            `Direct S3 Deletion failed for raw key ${key}:`,
            s3Error,
          );
        }
      }),
    );
  }

  // Path B: Full Record Lifecycle Cleanup
  if (mediaId) {
    const mediaRecord = await MediaModel.findById(mediaId);

    if (mediaRecord) {
      if (mediaRecord.fileKey) {
        try {
          await s3Service.deleteFromS3(mediaRecord.fileKey);
        } catch (s3Error) {
          console.error(
            `S3 Deletion failed for key ${mediaRecord.fileKey}:`,
            s3Error,
          );
        }
      }
      await MediaModel.findByIdAndDelete(mediaId);
    }
  }

  // Path C: Relationship Nullification
  if (parentModel && parentId && parentField) {
    await parentModel.findByIdAndUpdate(parentId, {
      $set: { [parentField]: null },
    });
  }
};
