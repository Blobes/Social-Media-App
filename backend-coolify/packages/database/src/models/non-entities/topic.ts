import { Schema, model } from "mongoose";
import { ITopicDocument } from "../../types/topic";

const TopicSchema = new Schema<ITopicDocument>(
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
