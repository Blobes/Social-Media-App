import mongoose, { ClientSession } from "mongoose";
import { TopicModel, UserModel } from "@repo/database";

export interface ManageTopicsParams {
  topics: string[];
  userId?: string;
  targetId?: string;
  targetModel?: "Gist" | "Stake" | "User";
  actionType: "USER_PREFERENCE" | "POST_CREATION_OR_UPDATE" | "POST_ENGAGEMENT";
}

/**
 * Attaches new topic IDs to a post and increments global postCount.
 */
export const handlePostCreationTopics = async (
  targetId: string,
  targetModel: string,
  topicDocs: any[],
  session?: ClientSession,
) => {
  const DynamicModel = mongoose.model(targetModel);
  const post = await DynamicModel.findById(targetId)
    .session(session || null)
    .select("topics");

  if (!post) throw new Error(`${targetModel} not found`);

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
 * Updates user preferences with new topics and increments global topic counts.
 */
export const handleUserPreferenceTopics = async (
  userId: string,
  topicDocs: any[],
  session?: ClientSession,
) => {
  const user = await UserModel.findById(userId)
    .session(session || null)
    .select("preferences");
  if (!user) throw new Error("User not found");

  const existingPrefIds = (user.preferences?.preferredTopics || []).map(
    (t: any) => t.topicId.toString(),
  );

  const newTopics = topicDocs.filter(
    (t) => !existingPrefIds.includes(t._id.toString()),
  );

  if (newTopics.length > 0) {
    const newTopicIds = newTopics.map((t) => t._id);

    await UserModel.updateOne(
      { _id: userId },
      {
        $push: {
          "preferences.preferredTopics": {
            $each: newTopics.map((t) => ({
              topicId: t._id,
              title: t.title,
              lastViewed: new Date(),
            })),
          },
        },
      },
      { session },
    );

    await TopicModel.updateMany(
      { _id: { $in: newTopicIds } },
      { $inc: { userCount: 1 } },
      { session },
    );
  }
};

/**
 * Updates 'lastViewed' for existing topics or adds new ones upon post engagement.
 */
export const handlePostEngagementTopics = async (
  userId: string,
  topicDocs: any[],
  session?: ClientSession,
) => {
  const user = await UserModel.findById(userId)
    .session(session || null)
    .select("preferences");
  if (!user) throw new Error("User not found");

  const preferredTopics = user.preferences?.preferredTopics || [];
  const existingPrefIds = preferredTopics.map((t: any) => t.topicId.toString());

  const toAdd = topicDocs.filter(
    (t) => !existingPrefIds.includes(t._id.toString()),
  );
  const toUpdateDate = topicDocs.filter((t) =>
    existingPrefIds.includes(t._id.toString()),
  );

  if (toAdd.length > 0) {
    const addIds = toAdd.map((t) => t._id);
    await UserModel.updateOne(
      { _id: userId },
      {
        $push: {
          "preferences.preferredTopics": {
            $each: toAdd.map((t) => ({
              topicId: t._id,
              title: t.title,
              lastViewed: new Date(),
            })),
          },
        },
      },
      { session },
    );

    await TopicModel.updateMany(
      { _id: { $in: addIds } },
      { $inc: { userCount: 1 } },
      { session },
    );
  }

  if (toUpdateDate.length > 0) {
    const updateIds = toUpdateDate.map((t) => t._id);

    await UserModel.updateOne(
      { _id: userId },
      {
        $set: { "preferences.preferredTopics.$[elem].lastViewed": new Date() },
      },
      {
        arrayFilters: [{ "elem.topicId": { $in: updateIds } }],
        session,
      },
    );
  }
};

/**
 * Synchronizes the canonical layout parameters across database structures.
 */
export const executeTopicUpdate = async (
  params: ManageTopicsParams,
  session?: ClientSession,
) => {
  const { topics, userId, targetId, targetModel, actionType } = params;

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
    case "USER_PREFERENCE":
      if (!userId)
        throw new Error("User not authenticated for status preference updates");
      await handleUserPreferenceTopics(userId, topicDocs, session);
      break;

    case "POST_CREATION_OR_UPDATE":
      if (!targetId || !targetModel) {
        throw new Error(
          "targetId and targetModel are required parameters for post processing operations",
        );
      }
      await handlePostCreationTopics(targetId, targetModel, topicDocs, session);
      break;

    case "POST_ENGAGEMENT":
      if (userId) {
        await handlePostEngagementTopics(userId, topicDocs, session);
      }
      break;

    default:
      throw new Error("Invalid operational routing type target received");
  }

  return topicDocs;
};

export const pruneDeadTopics = async (topicIds?: string[]) => {
  // Calculate the date 30 days ago from "now"
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const query: any = {
    userCount: 0,
    postCount: 0,
    // Using createdAt ensures we don't kill a topic created 5 minutes ago
    createdAt: { $lt: thirtyDaysAgo },
  };

  // If specific IDs are provided via the controller, we apply the filter
  if (topicIds && topicIds.length > 0) {
    query._id = { $in: topicIds };
  }

  const result = await TopicModel.deleteMany(query);
  return result.deletedCount;
};

export const removeTopicsFromUser = async (
  userId: string,
  staleTopicIds: string[],
) => {
  if (!staleTopicIds.length) return;

  // 1. Remove the specific topics from the User's array
  const userUpdate = await UserModel.updateOne(
    { _id: userId },
    { $pull: { preferredTopics: { _id: { $in: staleTopicIds } } } },
  );

  // 2. Decrement the global userCount only if the user document was actually modified
  if (userUpdate.modifiedCount > 0) {
    await TopicModel.updateMany(
      { _id: { $in: staleTopicIds } },
      { $inc: { userCount: -1 } },
    );
  }
};
