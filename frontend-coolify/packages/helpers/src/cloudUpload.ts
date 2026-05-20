import { Dimensions, MediaType, SERVER_API, StorageProvider } from "@repo/core";
import { apiClient } from "./apiClient";
import {
  generateBlurHash,
  getImageDimensions,
  getVideoMetadata,
} from "./media";

interface PresignResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}

interface APIResponse {
  status: "SUCCESS" | "ERROR";
  message: string;
  payload: PresignResponse;
}

interface UploadPayload {
  url: string;
  fileKey: string;
  type: MediaType;
  thumbnailUrl: string | null;
  mimeType: string;
  size: number;
  dimensions: Dimensions;
  blurHash: string;
  storageProvider: StorageProvider;
}

/**
 * Auxiliary pipeline helper to request a presigned URL and put an asset file to S3.
 */
const executeDirectUpload = async (
  file: File | Blob,
  mimeType: string,
): Promise<PresignResponse> => {
  const response = await apiClient<APIResponse>(SERVER_API.mediaUpload, {
    method: "POST",
    body: JSON.stringify({ fileType: mimeType }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status !== "SUCCESS" || !response.payload) {
    throw new Error(response.message || "Failed to get upload signature");
  }

  const { uploadUrl, fileKey, publicUrl } = response.payload;

  const uploadResult = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": mimeType,
    },
  });

  if (!uploadResult.ok) {
    throw new Error(`Cloud upload failed with status: ${uploadResult.status}`);
  }
  return { uploadUrl, fileKey, publicUrl };
};

/**
 * Main processing orchestrator for a single media asset file pipeline.
 */
const processSingleFile = async (file: File): Promise<UploadPayload> => {
  const MAX_SIZE = 100 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error(`File ${file.name} size exceeds the 100MB limit.`);
  }

  const isVideo = file.type.startsWith("video");
  let dimensions: { width: number; height: number; aspectRatio: number };
  let blurHash: string | null = null;
  let thumbnailUrl: string | null = null;

  if (isVideo) {
    const videoData = await getVideoMetadata(file);
    dimensions = videoData.dimensions;

    const [mainVideoUpload, computedBlurHash, thumbnailUpload] =
      await Promise.all([
        executeDirectUpload(file, file.type),
        generateBlurHash(videoData.thumbnailBlob),
        executeDirectUpload(videoData.thumbnailBlob, "image/jpeg"),
      ]);

    blurHash = computedBlurHash;
    thumbnailUrl = thumbnailUpload.publicUrl;

    return {
      url: mainVideoUpload.publicUrl,
      fileKey: mainVideoUpload.fileKey,
      type: "VIDEO",
      thumbnailUrl,
      mimeType: file.type,
      size: file.size,
      dimensions,
      blurHash,
      storageProvider: "S3",
    };
  }

  const [imgDimensions, imgBlurHash, mainImageUpload] = await Promise.all([
    getImageDimensions(file),
    generateBlurHash(file),
    executeDirectUpload(file, file.type),
  ]);

  return {
    url: mainImageUpload.publicUrl,
    fileKey: mainImageUpload.fileKey,
    type: file.type === "image/gif" ? "GIF" : "IMAGE",
    thumbnailUrl: null,
    mimeType: file.type,
    size: file.size,
    dimensions: imgDimensions,
    blurHash: imgBlurHash,
    storageProvider: "S3",
  };
};

/**
 * Accepts single or multiple file attachments and uploads them concurrently to S3.
 */
export const uploadMediaToCloud = async (
  files: File | File[],
): Promise<UploadPayload[]> => {
  const fileList = Array.isArray(files) ? files : [files];

  // Maps entire file sequence to un-awaited processing task wrappers
  const uploadPromises = fileList.map((file) => processSingleFile(file));

  return Promise.all(uploadPromises);
};
