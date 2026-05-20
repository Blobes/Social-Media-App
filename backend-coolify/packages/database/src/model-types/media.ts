export type StorageProvider = "S3" | "CLOUDINARY" | "GCP";
export type IMediaType = "IMAGE" | "VIDEO" | "GIF";
export type IMediaStatus = "UPLOADING" | "READY" | "ERROR";
export type MediaSourceType = "GIST" | "STAKE" | "USER" | "VERIFICATION";

export interface IMedia {
  url: string;
  fileKey: string;
  type: IMediaType;
  thumbnailUrl?: string | null;
  mimeType?: string | null;
  size?: number | null;
  dimensions?: { width: number; height: number; aspectRatio: number };
  blurHash?: string | null;
  storageProvider: StorageProvider;
}

export interface IMediaModel extends IMedia {
  _id: string;
  ownerId: string;

  // Polymorphic relation details
  sourceId?: string | null;
  sourceType?: MediaSourceType | null;

  // UI/Performance
  order?: number;
  status?: IMediaStatus;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}
