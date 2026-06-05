"use client";

import {
  AllowedMimeType,
  Dimensions,
  ISinglePayload,
  MediaProcessingStatus,
  SERVER_API,
  TrackedFile,
  MediaUploadPayload,
} from "@repo/core";
import { apiClient } from "./apiClient";
import {
  generateBlurHash,
  getImageDimensions,
  getVideoMetadata,
} from "./media";
import { queueBgUpload } from "./worker";

interface PresignFields {
  [key: string]: string;
}

interface PresignResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}

interface UploadPolicyPayload extends PresignResponse {
  fields: PresignFields;
}

interface InitMultipartPayload {
  uploadId: string;
  fileKey: string;
}

interface SignPartPayload {
  partUploadUrl: string;
}

interface MultipartPartSignature {
  ETag: string;
  PartNumber: number;
}

const CHUNK_SIZE = 15 * 1024 * 1024;

/**
 * Fires unified upload states directly into the browser window context.
 */
const emitUploadProgress = (
  trackingId: string,
  status: MediaProcessingStatus,
  progress: number,
  error?: string,
): void => {
  const event = new CustomEvent(`media-progress-${trackingId}`, {
    detail: { status, progress, error },
  });
  window.dispatchEvent(event);
};

/**
 * Executes a monitored network push using XMLHttpRequest to surface exact progress ticks.
 */
const uploadWithProgress = (
  url: string,
  method: "POST" | "PUT",
  body: FormData | File | Blob,
  trackingId: string,
  contentType?: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    if (contentType) {
      xhr.setRequestHeader("Content-Type", contentType);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        emitUploadProgress(trackingId, "UPLOADING", percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `Server responded with unexpected status code: ${xhr.status}`,
          ),
        );
      }
    };

    xhr.onerror = () =>
      reject(new Error("Network transmission failure occurred"));
    xhr.send(body);
  });
};

/**
 * Determines if the client device has enough hardware resources for local WebAssembly compression.
 */
export const checkDeviceCapability = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as any).deviceMemory || 4;
  return cores >= 4 && deviceMemory >= 4;
};

/**
 * Auxiliary pipeline helper to request a presigned POST policy and upload an asset file via FormData.
 */
const fetchPostPolicy = async (
  file: File | Blob,
  mimeType: AllowedMimeType,
  trackingId: string,
): Promise<PresignResponse> => {
  const response = await apiClient<ISinglePayload<UploadPolicyPayload>>(
    SERVER_API.mediaUpload,
    {
      method: "POST",
      body: JSON.stringify({ fileType: mimeType }),
      headers: { "Content-Type": "application/json" },
    },
  );

  if (response.status !== "SUCCESS" || !response.payload) {
    throw new Error(
      response.message || "Failed to get upload signature policy",
    );
  }

  const { uploadUrl, fields, fileKey, publicUrl } = response.payload;
  const formData = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value as string);
  });
  formData.append("file", file);

  emitUploadProgress(trackingId, "UPLOADING", 0);
  await uploadWithProgress(uploadUrl, "POST", formData, trackingId);

  return { uploadUrl, fileKey, publicUrl };
};

/**
 * Auxiliary pipeline helper to request a presigned PUT URL and put an asset file to S3.
 */
const fetchUploadUrl = async (
  file: File | Blob,
  mimeType: AllowedMimeType,
  trackingId: string,
): Promise<PresignResponse> => {
  const response = await apiClient<ISinglePayload<PresignResponse>>(
    SERVER_API.getMediaUrl,
    {
      method: "POST",
      body: JSON.stringify({ fileType: mimeType }),
      headers: { "Content-Type": "application/json" },
    },
  );

  if (response.status !== "SUCCESS" || !response.payload) {
    throw new Error(response.message || "Failed to get upload signature url");
  }

  const { uploadUrl, fileKey, publicUrl } = response.payload;

  const bgFetchInstance = await queueBgUpload(uploadUrl, file, mimeType);
  if (bgFetchInstance) {
    console.log(
      `Upload offloaded to browser service worker background context: ${bgFetchInstance.id}`,
    );
    emitUploadProgress(trackingId, "SUCCESS", 100);
    return { uploadUrl, fileKey, publicUrl };
  }

  emitUploadProgress(trackingId, "UPLOADING", 0);
  await uploadWithProgress(uploadUrl, "PUT", file, trackingId, mimeType);

  return { uploadUrl, fileKey, publicUrl };
};

/**
 * Concurrent chunk processing flows using Cloudflare R2 native multipart structures.
 */
export const executeMultipartUpload = async (
  file: File | Blob,
  mimeType: AllowedMimeType,
  trackingId: string,
): Promise<string> => {
  const initResponse = await apiClient<ISinglePayload<InitMultipartPayload>>(
    SERVER_API.initMultipart,
    {
      method: "POST",
      body: JSON.stringify({ fileType: mimeType }),
    },
  );

  if (initResponse.status !== "SUCCESS" || !initResponse.payload) {
    throw new Error(
      initResponse.message || "Failed to initialize multipart session",
    );
  }

  const { uploadId, fileKey } = initResponse.payload;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadPartsPromises: Promise<MultipartPartSignature>[] = [];

  const chunkProgressTracker: Record<number, number> = {};

  const calculateTotalProgress = () => {
    const totalUploadedBytes = Object.values(chunkProgressTracker).reduce(
      (a, b) => a + b,
      0,
    );
    const overallPercent = Math.round((totalUploadedBytes / file.size) * 100);
    emitUploadProgress(trackingId, "UPLOADING", Math.min(overallPercent, 99));
  };

  for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
    const start = (partNumber - 1) * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunkBlob = file.slice(start, end);
    chunkProgressTracker[partNumber] = 0;

    const chunkTask = async (
      retryCount = 0,
    ): Promise<MultipartPartSignature> => {
      try {
        const signResponse = await apiClient<ISinglePayload<SignPartPayload>>(
          SERVER_API.signPart,
          {
            method: "POST",
            body: JSON.stringify({ uploadId, fileKey, partNumber }),
          },
        );

        if (signResponse.status !== "SUCCESS" || !signResponse.payload) {
          throw new Error(
            signResponse.message || `Failed to sign part segment ${partNumber}`,
          );
        }

        const { partUploadUrl } = signResponse.payload;

        const etagValue = await new Promise<string>(
          (resolvePart, rejectPart) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", partUploadUrl);
            xhr.setRequestHeader("Content-Type", mimeType);

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                chunkProgressTracker[partNumber] = event.loaded;
                calculateTotalProgress();
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const etag = xhr.getResponseHeader("ETag");
                if (!etag)
                  rejectPart(
                    new Error(`Missing validation tag on track ${partNumber}`),
                  );
                else resolvePart(etag.replace(/"/g, ""));
              } else {
                rejectPart(new Error(`Chunk upload failed: ${xhr.status}`));
              }
            };

            xhr.onerror = () => rejectPart(new Error("Chunk network failure"));
            xhr.send(chunkBlob);
          },
        );

        return { ETag: etagValue, PartNumber: partNumber };
      } catch (err) {
        if (retryCount < 3) {
          return chunkTask(retryCount + 1);
        }
        throw err;
      }
    };

    uploadPartsPromises.push(chunkTask());
  }

  const completedParts = await Promise.all(uploadPartsPromises);

  const completeResponse = await apiClient<ISinglePayload<null>>(
    SERVER_API.completeMultipart,
    {
      method: "POST",
      body: JSON.stringify({ uploadId, fileKey, parts: completedParts }),
    },
  );

  if (completeResponse.status !== "SUCCESS") {
    throw new Error(
      completeResponse.message ||
        "Failed to complete chunk assembly processing session",
    );
  }

  return fileKey;
};

/**
 * Main processing orchestrator for a single media asset file pipeline.
 */
const processSingleFile = async (file: File): Promise<MediaUploadPayload> => {
  const MAX_SINGLE_SIZE = 100 * 1024 * 1024;
  if (file.size > MAX_SINGLE_SIZE) {
    throw new Error(`File ${file.name} size exceeds the 100MB limit.`);
  }

  const trackingId =
    (file as any).trackingId || Math.random().toString(36).substring(2, 9);
  (file as TrackedFile).trackingId = trackingId;

  const fileType = file.type as AllowedMimeType;
  const isVideo = fileType.startsWith("video");
  let dimensions: Dimensions;
  let blurHash: string | null = null;
  let thumbnailUrl: string | null = null;

  try {
    if (isVideo) {
      const videoData = await getVideoMetadata(file);
      dimensions = videoData.dimensions;

      let finalFileKey: string;
      let targetUrl: string;
      const videoMimeType: AllowedMimeType = "video/mp4";

      if (file.size > 16 * 1024 * 1024) {
        finalFileKey = await executeMultipartUpload(
          file,
          videoMimeType,
          trackingId,
        );

        const configResponse = await apiClient<ISinglePayload<PresignResponse>>(
          SERVER_API.getMediaUrl,
          {
            method: "POST",
            body: JSON.stringify({ fileKey: finalFileKey }),
          },
        );

        if (configResponse.status !== "SUCCESS" || !configResponse.payload) {
          throw new Error(
            configResponse.message ||
              "Failed to resolve file key registration parameters",
          );
        }

        targetUrl = configResponse.payload.publicUrl;
      } else {
        const directUpload = await fetchUploadUrl(
          file,
          videoMimeType,
          trackingId,
        );
        finalFileKey = directUpload.fileKey;
        targetUrl = directUpload.publicUrl;
      }

      const thumbnailMimeType: AllowedMimeType = "image/jpeg";
      const [computedBlurHash, thumbnailUpload] = await Promise.all([
        generateBlurHash(videoData.thumbnailBlob),
        fetchUploadUrl(
          videoData.thumbnailBlob,
          thumbnailMimeType,
          `${trackingId}-thumb`,
        ),
      ]);

      blurHash = computedBlurHash;
      thumbnailUrl = thumbnailUpload.publicUrl;

      emitUploadProgress(trackingId, "SUCCESS", 100);

      return {
        url: targetUrl,
        fileKey: finalFileKey,
        type: "VIDEO",
        thumbnailUrl,
        mimeType: videoMimeType,
        size: file.size,
        dimensions,
        blurHash,
        storageProvider: "S3",
      };
    }

    emitUploadProgress(trackingId, "UPLOADING", 0);
    const [imgDimensions, imgBlurHash, mainImageUpload] = await Promise.all([
      getImageDimensions(file),
      generateBlurHash(file),
      fetchPostPolicy(file, fileType, trackingId),
    ]);

    emitUploadProgress(trackingId, "SUCCESS", 100);

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
  } catch (err: any) {
    emitUploadProgress(
      trackingId,
      "FAILED",
      0,
      err.message || "Processing failed",
    );
    throw err;
  }
};

/**
 * Accepts single or multiple file attachments and uploads them concurrently to S3.
 */
export const uploadMediaToCloud = async (
  files: File | File[],
): Promise<MediaUploadPayload[]> => {
  const fileList = Array.isArray(files) ? files : [files];
  const MAX_COMBINED_SIZE = 150 * 1024 * 1024;
  const totalSize = fileList.reduce((sum, file) => sum + file.size, 0);

  if (totalSize > MAX_COMBINED_SIZE) {
    throw new Error(
      "The total size of all uploaded files exceeds the 150MB limit.",
    );
  }

  const uploadPromises = fileList.map((file) => processSingleFile(file));
  return Promise.all(uploadPromises);
};
