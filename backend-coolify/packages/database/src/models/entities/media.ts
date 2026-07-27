import { Schema, model, Model } from "mongoose";
import { IMediaDocument } from "../../types/media";

const ElementPositionSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false },
);

const TextOnMediaSchema = new Schema(
  {
    id: { type: String, required: true },
    content: { type: String, required: true },
    position: { type: ElementPositionSchema, required: true },
    fontType: { type: String, required: true },
    colorType: { type: String, required: true },
    size: { type: Number, required: true },
    textAlign: {
      type: String,
      enum: ["left", "center", "right"],
      default: "center",
    },
  },
  { _id: false },
);

const StickerOnMediaSchema = new Schema(
  {
    id: { type: String, required: true },
    content: { type: String, required: true },
    position: { type: ElementPositionSchema, required: true },
    size: { type: Number, required: true },
    category: {
      type: String,
      enum: ["STICKER", "EMOJI"],
      default: "STICKER",
    },
  },
  { _id: false },
);

const CustomizedMediaSchema = new Schema(
  {
    textsOnMedia: { type: [TextOnMediaSchema], default: [] },
    filter: {
      type: String,
      enum: [
        "ORIGINAL",
        "CLARENDON",
        "GINGHAM",
        "MOON",
        "LARK",
        "REYES",
        "JUNO",
        "SLUMBER",
      ],
      default: "ORIGINAL",
    },
    stickersOnMedia: { type: [StickerOnMediaSchema], default: [] },
  },
  { _id: false },
);

const MediaSchema = new Schema<IMediaDocument>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    sourceId: {
      type: Schema.Types.ObjectId,
      required: false,
      refPath: "sourceType",
    },
    sourceType: {
      type: String,
      required: false,
      enum: ["GIST", "STAKE", "USER", "VERIFICATION"],
    },

    // Storage Details
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    storageProvider: {
      type: String,
      enum: ["S3", "CLOUDINARY", "GCP"],
      default: "S3",
    },
    fileKey: { type: String, required: true },

    // Metadata for UI/UX
    type: { type: String, enum: ["IMAGE", "VIDEO", "GIF"], required: true },
    mimeType: { type: String },
    size: { type: Number },
    dimensions: {
      width: { type: Number },
      height: { type: Number },
      aspectRatio: { type: Number },
    },

    // Performance Optimization
    blurHash: { type: String },
    order: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["UPLOADING", "READY", "ERROR", "BANNED"],
      default: "READY",
    },

    // Embedded Media Customizations
    customizations: { type: CustomizedMediaSchema, default: null },

    // Moderation log
    moderationCase: {
      caseId: {
        type: Schema.Types.ObjectId,
        ref: "ModerationCase",
        default: null,
      },
      caseCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    autoIndex: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        if (ret._id) ret._id = ret._id.toString();
        return ret;
      },
    },
  },
);

export const MediaModel: Model<IMediaDocument> = model<IMediaDocument>(
  "Media",
  MediaSchema,
  "media",
);
