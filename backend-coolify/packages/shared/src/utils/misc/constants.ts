// 1. Define allowed formats
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime", // .mov
  "image/gif",
] as const;

// 2. Define size limits (100MB)
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

// 3. Helper to get extension from mime type (useful for S3 keys)
export const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "image/gif": "gif",
};

// Create a type from the array for strict TypeScript checking
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

const ISO_MAP: Record<string, string> = {
  eng: "en",
  spa: "es",
  fra: "fr",
  deu: "de",
  ita: "it",
  por: "pt",
  cmn: "zh", // Mandarin / Chinese
  jpn: "ja",
  arb: "ar",
  rus: "ru",
};
/**
 * Converts a 3-letter language code to a 2-letter fallback code.
 */
export const to2ISOCode = (threeLetterCode: string): string => {
  return ISO_MAP[threeLetterCode] || "en"; // Default fallback to English if text is ambiguous
};
