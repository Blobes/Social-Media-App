import { Schema, model } from "mongoose";

// User follows
const FollowSchema = new Schema(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followingId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Crucial: Compound index for fast lookups and to prevent duplicate follows
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followingId: 1 }); // For "Get my followers"

export const FollowModel = model("Follow", FollowSchema, "follows");

// Blocking users
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
