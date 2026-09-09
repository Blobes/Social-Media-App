import { Schema, Document, Model, model } from "mongoose";
import { ISecurityQuestionDocument } from "../../types/misc";

const SecurityQuestionSchema = new Schema<ISecurityQuestionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    questions: [
      {
        _id: false,
        question: { type: String, required: true, trim: true },
        answerHash: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

export const SecurityQuestionModel: Model<ISecurityQuestionDocument> =
  model<ISecurityQuestionDocument>(
    "SecurityQuestion",
    SecurityQuestionSchema,
    "security_questions",
  );
