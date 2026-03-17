import { Severity } from "@/services/moderation/";

export interface IMediaInput {
  url: string;
  fileKey: string;
  type: "IMAGE" | "VIDEO" | "GIF";
  thumbnailUrl?: string;
  mimeType?: string;
  size?: number;
  dimensions?: { width: number; height: number; aspectRatio: number };
  blurHash?: string;
  storageProvider?: "S3" | "CLOUDINARY" | "GCP";
}

export interface ModerationResponse {
  extractedTopics: string[];
  isFlagged?: boolean;
  isUnsure: boolean;
  severity: Severity | null;
  ruleViolated: string | null;
  reason: string | null;
}
