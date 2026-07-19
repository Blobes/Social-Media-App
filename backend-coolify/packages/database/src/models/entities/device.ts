import { Schema, model } from "mongoose";
import { IDevice } from "../../types/device";

const DeviceSchema = new Schema<IDevice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },

    deviceToken: {
      type: String,
      index: true,
      required: true,
    },

    name: {
      type: String,
      default: null,
    },

    deviceType: String,
    os: String,
    browser: String,

    userAgent: String,
    ipHash: String,
    lastCountry: String,

    isPrimary: {
      type: Boolean,
      default: false,
    },

    isStale: {
      type: Boolean,
      default: false,
      index: true, // Index this for the cleanup job
    },

    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true, // Critical for cleanup performance
    },

    lastVerifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

export const DeviceModel = model<IDevice>("Device", DeviceSchema, "devices");
