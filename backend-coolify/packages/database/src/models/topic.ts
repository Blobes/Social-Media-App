import { Schema, model } from "mongoose";
import { ITopic } from "../types/topic";

const TopicSchema = new Schema<ITopic>(
  {
    title: { type: String, required: true, unique: true },
    userCount: { type: Number, required: true, default: 0 },
    postCount: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
    autoIndex: false,
  },
);

export const TopicModel = model("Topic", TopicSchema, "topics");
