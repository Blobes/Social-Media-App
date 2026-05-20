import { AnalyzedImage } from "@repo/core";
import { encode } from "blurhash";

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
      // Seek slightly forward to avoid extracting a purely black initial frame
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
