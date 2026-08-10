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
  { timestamps: true },
);

// --- ID Verification Request Schema Index Configurations ---
// Primary user pending verification check
IdVerificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
// Admin verification review queue
IdVerificationSchema.index({ status: 1, submittedAt: 1 });

export const IdVerificationRequestModel = model(
  "IdVerificationRequest",
  IdVerificationSchema,
  "id_verification_requests",
);
