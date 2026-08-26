import { Model, Schema, model } from "mongoose";
import { IRelationTupleDocument } from "../../../types/authorization";

const RelationTupleSchema = new Schema<IRelationTupleDocument>(
  {
    subjectType: {
      type: String,
      required: true,
      enum: ["user", "group"],
    },
    subjectId: { type: String, required: true },
    relation: {
      type: String,
      required: true,
      enum: ["owner", "editor", "viewer", "follower", "blocked"],
    },
    objectType: {
      type: String,
      required: true,
      enum: ["user", "post", "comment", "device"],
    },
    objectId: { type: String, required: true },
  },
  { timestamps: true },
);

// High-performance compound indexes for relationship evaluation
RelationTupleSchema.index(
  { subjectId: 1, relation: 1, objectType: 1, objectId: 1 },
  { unique: true },
);
RelationTupleSchema.index({ objectType: 1, objectId: 1, relation: 1 });

/**
 * Model schema for managing dynamic ReBAC relationship tuples.
 */
export const RelationTupleModel: Model<IRelationTupleDocument> =
  model<IRelationTupleDocument>(
    "RelationTuple",
    RelationTupleSchema,
    "relation_tuples",
  );
