import { Document, Types } from "mongoose";

/**
 * Interface defining topic preference tracking subdocument.
 */
export interface IUserPreferredTopic {
  topicId: Types.ObjectId;
  title: string;
  lastViewed?: Date;
}

export interface ITopicDocument extends Document {
  title: string;
  userCount: number;
  postCount: number;
  createdAt: Date;
  updatedAt: Date;
}
