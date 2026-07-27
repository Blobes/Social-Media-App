import { Types } from "mongoose";
import { IContentModeration } from "./moderation";

export type StorageProvider = "S3" | "CLOUDINARY" | "GCP";
export type IMediaType = "IMAGE" | "VIDEO" | "GIF";
export type IMediaStatus = "UPLOADING" | "READY" | "ERROR" | "BANNED";
export type MediaSourceType = "GIST" | "STAKE" | "USER" | "VERIFICATION";

type TextAlignment = "left" | "center" | "right";
export type FontType =
  | "sans-serif"
  | "serif"
  | "monospace"
  | "cursive"
  | "fantasy"
  | "system-ui"
  | "cursive-bold";
export type ColorType =
  | "CLEAR_LIGHT"
  | "TRANSLUCENT_LIGHT"
  | "TRANSLUCENT_DARK"
  | "SOLID_LIGHT"
  | "SOLID_DARK"
  | "BRIGHT_RED"
  | "BRIGHT_BLUE"
  | "BRIGHT_YELLOW"
  | "BRIGHT_GREEN"
  | "BRIGHT_PINK"
  | "BRIGHT_ORANGE"
  | "BRIGHT_PURPLE";
export type ImageFilterType =
  | "ORIGINAL"
  | "CLARENDON"
  | "GINGHAM"
  | "MOON"
  | "LARK"
  | "REYES"
  | "JUNO"
  | "SLUMBER";

interface ElementPosition {
  x: number;
  y: number;
}

export interface TextOnMedia {
  id: string;
  content: string;
  position: ElementPosition;
  fontType: FontType;
  colorType: ColorType;
  size: number;
  textAlign?: TextAlignment;
}

export interface StickerOnMedia {
  id: string;
  content: string;
  position: ElementPosition;
  size: number;
  category?: "STICKER" | "EMOJI";
}

export interface CustomizedMedia {
  textsOnMedia: TextOnMedia[];
  filter: ImageFilterType;
  stickersOnMedia: StickerOnMedia[];
}

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
  customizations?: CustomizedMedia;
}

export interface IMediaDocument extends IMedia {
  _id: Types.ObjectId | string;
  ownerId: Types.ObjectId | string;

  // Polymorphic relation details
  sourceId?: Types.ObjectId | string | null;
  sourceType?: MediaSourceType | null;

  // UI/Performance
  order?: number;
  status?: IMediaStatus;

  moderationCase?: IContentModeration;

  createdAt?: string | Date;
  updatedAt?: string | Date;
}
