import { Schema, model } from "mongoose";

const TopicSchema = new Schema(
  {
    title: { type: String, required: true, unique: true },
    userCount: { type: Number, required: true, default: 0 },
    postCount: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
    autoIndex: false, // Stop mongodb auto index
  },
);

export const TopicModel = model("Topic", TopicSchema, "topics");
