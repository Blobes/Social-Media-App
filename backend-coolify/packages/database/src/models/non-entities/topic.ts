import { Model, Schema, model } from "mongoose";
import { ITopicDocument } from "../../types/misc";

const TopicSchema = new Schema<ITopicDocument>(
  {
    title: { type: String, required: true },
    userCount: { type: Number, required: true, default: 0 },
    postCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

// Topic Schema Indexes
TopicSchema.index({ title: 1 }, { unique: true });
TopicSchema.index({ postCount: -1 });
TopicSchema.index({ userCount: -1 });

/**
 * Model schema for tracking topics and aggregated usage metrics.
 */
export const TopicModel: Model<ITopicDocument> = model<ITopicDocument>(
  "Topic",
  TopicSchema,
  "topics",
);
