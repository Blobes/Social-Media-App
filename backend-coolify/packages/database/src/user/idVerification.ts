// src/models/VerificationRequest.ts
import { Schema, model } from "mongoose";

const IdVerificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fullName: String,
    evidenceLinks: [String], // News articles, official site
    idDocumentUrl: String, // Link to a photo of their ID
    identityDocument: {
      type: Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },
    verificationSelfie: {
      type: Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    autoIndex: false, // Stop mongodb auto index
  },
);

export const IdVerificationRequestModel = model(
  "IdVerificationRequest",
  IdVerificationSchema,
  "id_verification_requests",
);
