import mongoose, { ClientSession } from "mongoose";
import { TopicModel } from "@repo/database";
import { TransInfo } from "../../types";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { executeUserTopicsUpdate } from "./userTopic";

export type TopicUpdateEvent = "POST_CREATION_OR_UPDATE" | "POST_ENGAGEMENT";

export interface ManageTopicsParams {
  topics: string[];
  userId?: string;
  targetId?: string;
  targetModel?: "Gist" | "Stake" | "User";
  eventType: TopicUpdateEvent;
}

export interface ManageTopicsResult {
  status: "INVALID_INPUT" | "SUCCESS";
  transInfo: TransInfo;
  payload: any[];
}

/**
 * Attaches new topic IDs to a post and increments global postCount.
 */
export const handleViaPostCreation = async (
  targetId: string,
  targetModel: string,
  topicDocs: any[],
  session?: ClientSession,
): Promise<void> => {
  const DynamicModel = mongoose.model(targetModel);
  const post = await DynamicModel.findById(targetId)
    .session(session || null)
    .select("topics");

  if (!post) {
    throw new Error(
      MESSAGES_REGISTRY.SYSTEM.TARGET_MODEL_NOT_FOUND(targetModel).message,
    );
  }

  const existingPostTopicIds = (post.topics || []).map((id: any) =>
    id.toString(),
  );
  const newTopicIds = topicDocs
    .filter((t) => !existingPostTopicIds.includes(t._id.toString()))
    .map((t) => t._id);

  if (newTopicIds.length > 0) {
    await Promise.all([
      DynamicModel.updateOne(
        { _id: targetId },
        { $push: { topics: { $each: newTopicIds } } },
        { session },
      ),
      TopicModel.updateMany(
        { _id: { $in: newTopicIds } },
        { $inc: { postCount: 1 } },
        { session },
      ),
    ]);
  }
};

/**
 * Updates user preferences and metadata timestamps upon post engagement.
 */
export const handleViaPostEngagement = async (
  userId: string,
  topicDocs: any[],
  session?: ClientSession,
): Promise<void> => {
  const preferenceTopics = topicDocs.map((t) => ({
    topicId: t._id.toString(),
    title: t.title,
  }));

  await executeUserTopicsUpdate({
    userId,
    topics: preferenceTopics,
    mode: "ADD",
    updateMetadata: true,
    session,
  });
};

/**
 * Synchronizes topic entities and processes post-related actions.
 */
export const executePostTopicsUpdate = async (
  params: ManageTopicsParams,
  session?: ClientSession,
): Promise<ManageTopicsResult> => {
  const {
    topics,
    userId,
    targetId,
    targetModel,
    eventType: actionType,
  } = params;

  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.POST.POST_TOPICS_LIST_REQUIRED,
      payload: [],
    };
  }

  const uniqueTitles = [...new Set(topics.map((t) => t.trim().toLowerCase()))];

  const topicOps = uniqueTitles.map((title) => ({
    updateOne: {
      filter: { title },
      update: { $setOnInsert: { title, userCount: 0, postCount: 0 } },
      upsert: true,
    },
  }));

  await TopicModel.bulkWrite(topicOps, { session });

  const topicDocs = await TopicModel.find({
    title: { $in: uniqueTitles },
  })
    .session(session || null)
    .lean();

  switch (actionType) {
    case "POST_CREATION_OR_UPDATE":
      if (!targetId || !targetModel) {
        throw new Error(
          MESSAGES_REGISTRY.POST.MISSING_POST_PROCESSING_PARAMS.message,
        );
      }
      await handleViaPostCreation(targetId, targetModel, topicDocs, session);
      break;

    case "POST_ENGAGEMENT":
      if (userId) {
        await handleViaPostEngagement(userId, topicDocs, session);
      }
      break;

    default:
      throw new Error(
        MESSAGES_REGISTRY.SYSTEM.INVALID_OPERATIONAL_ROUTING.message,
      );
  }

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.POST_TOPICS_PROCESSED_SUCCESSFULLY,
    payload: topicDocs,
  };
};
