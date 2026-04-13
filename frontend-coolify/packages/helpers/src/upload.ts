import { SERVER_API } from "@repo/core";
import { apiClient } from "./apiClient";

/**
 * These types match the "SUCCESS" payload returned by your
 * Backend Controller's getUploadUrl method.
 */
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

/**
 * Uploads a file to S3 using a pre-signed URL and returns the metadata
 * needed for the createMediaBatch helper on the backend.
 */
export const uploadMediaToCloud = async (file: File) => {
  // 1. Client-side Size Validation (matches backend 100MB limit)
  const MAX_SIZE = 100 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("File size exceeds the 100MB limit.");
  }

  // 2. Request the secure signature from your API
  // We pass the fileType so the backend can generate a valid Content-Type signature
  const response = await apiClient<APIResponse>(SERVER_API.mediaUpload, {
    method: "POST",
    body: JSON.stringify({ fileType: file.type }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status !== "SUCCESS" || !response.payload) {
    throw new Error(response.message || "Failed to get upload signature");
  }

  const { uploadUrl, fileKey, publicUrl } = response.payload;

  // 3. Execute the Direct Upload to S3
  // The 'Content-Type' MUST match exactly what was signed by the backend.
  const uploadResult = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!uploadResult.ok) {
    throw new Error(`Cloud upload failed with status: ${uploadResult.status}`);
  }

  // 4. Return formatted metadata for the createGist/createMediaBatch call
  return {
    url: publicUrl,
    fileKey: fileKey,
    type: file.type.startsWith("video")
      ? "VIDEO"
      : file.type === "image/gif"
        ? "GIF"
        : "IMAGE",
    mimeType: file.type,
    size: file.size,
  };
};
