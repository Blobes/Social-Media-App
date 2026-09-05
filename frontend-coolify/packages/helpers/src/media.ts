import {
  AnalyzedImage,
  MediaProcessingStatus,
  MediaProcessingProgress,
  STORAGE_KEYS,
} from "@repo/core";
import { encode } from "blurhash";

interface WorkerProgressEventData {
  action: "PROGRESS";
  id: string;
  status: MediaProcessingStatus;
  progress: number;
  error?: string;
}

interface WorkerSuccessEventData {
  action: "SUCCESS";
  id: string;
  status: "SUCCESS";
  blob: Blob;
  originalSize: number;
  compressedSize: number;
}

interface WorkerErrorEventData {
  action: "ERROR";
  id: string;
  status: "ERROR";
  error: string;
}

type WorkerMessageEvent = MessageEvent<
  WorkerProgressEventData | WorkerSuccessEventData | WorkerErrorEventData
>;

/**
 * Determines orientation based on natural image dimensions.
 */
export const analyzeImage = (img: HTMLImageElement): AnalyzedImage | null => {
  if (!img) return null;
  return {
    height: img.naturalHeight,
    width: img.naturalWidth,
    isPortrait: img.naturalHeight > img.naturalWidth,
  };
};

export const getImageDimensions = (
  file: File,
): Promise<{ width: number; height: number; aspectRatio: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      resolve({
        width,
        height,
        aspectRatio: width / height,
      });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error("Failed to parse image dimensions"));
      URL.revokeObjectURL(img.src);
    };
  });
};

/**
 * Extracts natural dimensions and captures a thumbnail snapshot at the 1-second mark for videos.
 */
export const getVideoMetadata = (
  file: File,
): Promise<{
  dimensions: { width: number; height: number; aspectRatio: number };
  thumbnailBlob: Blob;
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);

    video.onloadeddata = () => {
      video.currentTime = 1;
    };

    video.onseeked = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      const aspectRatio = width / height;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(
          new Error("Failed to create canvas context for video thumbnail"),
        );
        URL.revokeObjectURL(video.src);
        return;
      }

      context.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to export video thumbnail blob"));
          } else {
            resolve({
              dimensions: { width, height, aspectRatio },
              thumbnailBlob: blob,
            });
          }
          URL.revokeObjectURL(video.src);
        },
        "image/jpeg",
        0.85,
      );
    };

    video.onerror = () => {
      reject(new Error("Failed to parse video track metadata"));
      URL.revokeObjectURL(video.src);
    };
  });
};

/**
 * Generates a compact structural blurhash from an image file or thumbnail blob.
 */
export const generateBlurHash = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.width = 32;
      canvas.height = 32;

      if (!context) {
        reject(new Error("Could not initialize 2D canvas context layer"));
        URL.revokeObjectURL(img.src);
        return;
      }

      context.drawImage(img, 0, 0, 32, 32);
      const imageData = context.getImageData(0, 0, 32, 32);

      const hash = encode(
        imageData.data,
        imageData.width,
        imageData.height,
        4,
        4,
      );
      resolve(hash);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error("Failed to process asset matrix blurhash"));
      URL.revokeObjectURL(img.src);
    };
  });
};

/**
 * Dispatches a raw video file to a background worker thread for local WebAssembly compression using custom progress events.
 */
export const compressVideoAsync = (file: File, id: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./video-worker.js"));
    //  const worker = new Worker(new URL("./video-worker.js", import.meta.url));

    worker.onmessage = (event: WorkerMessageEvent) => {
      const { action, id: responseId, status } = event.data;

      if (responseId !== id) return;

      if (action === "PROGRESS") {
        const detail: MediaProcessingProgress = {
          status,
          progress: event.data.progress,
        };
        const progressEvent = new CustomEvent(
          `${STORAGE_KEYS.MEDIA_COMPRESSION}-${id}`,
          {
            detail,
          },
        );
        window.dispatchEvent(progressEvent);
      } else if (action === "SUCCESS") {
        const detail: MediaProcessingProgress = {
          status: "SUCCESS",
          progress: 100,
        };
        const successEvent = new CustomEvent(
          `${STORAGE_KEYS.MEDIA_COMPRESSION}-${id}`,
          {
            detail,
          },
        );
        window.dispatchEvent(successEvent);

        worker.terminate();
        resolve(event.data.blob);
      } else if (action === "ERROR") {
        const { error } = event.data;
        const detail: MediaProcessingProgress = {
          status: "ERROR",
          progress: 0,
          error,
        };
        const errorEvent = new CustomEvent(
          `${STORAGE_KEYS.MEDIA_COMPRESSION}-${id}`,
          {
            detail,
          },
        );
        window.dispatchEvent(errorEvent);

        worker.terminate();
        reject(new Error(error || "Video processing error"));
      }
    };

    worker.postMessage({ action: "COMPRESS_VIDEO", file, id });
  });
};
