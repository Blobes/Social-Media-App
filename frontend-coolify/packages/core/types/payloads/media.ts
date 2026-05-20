export type StorageProvider = "S3" | "CLOUDINARY" | "GCP";
export type MediaType = "IMAGE" | "VIDEO" | "GIF";
export type MediaStatus = "UPLOADING" | "READY" | "ERROR";
export type MediaSourceType = "GIST" | "STAKE" | "USER" | "VERIFICATION";

export interface Dimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface IMediaPayload {
  _id: string;
  ownerId?: string;
  alt?: string;

  // Polymorphic relation details
  sourceId?: string | null;
  sourceType?: MediaSourceType | null;

  // Storage
  url: string;
  thumbnailUrl?: string | null;
  storageProvider?: StorageProvider;
  fileKey?: string | null;

  // Metadata
  type?: MediaType;
  mimeType?: string | null;
  size?: number | null;
  dimensions?: Dimensions;

  // UI/Performance
  blurHash?: string | null;
  order?: number;
  status?: MediaStatus;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}
