import { Schema, model } from "mongoose";

const BlockedUserSchema = new Schema(
  {
    blockerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    blockedId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Ensure a user can't block the same person twice
BlockedUserSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

export const BlockedModel = model(
  "BlockedUser",
  BlockedUserSchema,
  "blocked_users",
);
