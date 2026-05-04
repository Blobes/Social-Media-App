import { MediaModel } from "@repo/database";
import { Model } from "mongoose";
import { IS3Config } from "../../types/types";
import { createS3Service } from "../../services/s3";

interface HardDeleteOptions {
  mediaId: string | any;
  parentModel?: Model<any>;
  parentId?: string;
  parentField?: string;
  s3Config: IS3Config;
}

/**
 * Utility to perform a hard delete:
 * 1. Deletes from AWS S3
 * 2. Deletes from Media Collection
 * 3. Nullifies reference in Parent Collection (Optional)
 */
export const hardDeleteMedia = async ({
  mediaId,
  parentModel,
  parentId,
  parentField,
  s3Config,
}: HardDeleteOptions): Promise<void> => {
  if (!mediaId) return;

  // 1. Fetch Media Record to get S3 Key
  const mediaRecord = await MediaModel.findById(mediaId);

  const s3Service = createS3Service(s3Config);

  if (mediaRecord) {
    // 2. Remove physical file from S3
    if (mediaRecord.fileKey) {
      try {
        await s3Service.deleteFromS3(mediaRecord.fileKey);
      } catch (s3Error) {
        console.error(
          `S3 Deletion failed for key ${mediaRecord.fileKey}:`,
          s3Error,
        );
        // We continue to ensure DB cleanup happens even if S3 fails
      }
    }

    // 3. Remove metadata from Media Collection
    await MediaModel.findByIdAndDelete(mediaId);
  }

  // 4. Nullify the reference in the parent document if provided
  if (parentModel && parentId && parentField) {
    await parentModel.findByIdAndUpdate(parentId, {
      $set: { [parentField]: null },
    });
  }
};
