import { TopicModel, UserModel } from "@repo/database";
import { Response } from "express";
import mongoose from "mongoose";
import { IAuthRequest } from "../../types/types";

/**
 * Interface for the Topic Management payload.
 * Extends IAuthRequest to ensure req.user is typed correctly.
 */
interface ManageRequest extends IAuthRequest {
  body: {
    topics: string[];
    targetId?: string;
    targetModel?: "Gist" | "Stake" | "User";
    actionType: "USER_PREFERENCE" | "POST_CREATION" | "POST_ENGAGEMENT";
  };
}

/**
 * Orchestrates topic creation, on user preference settings, post creation and post engagement.
 */
export const manageTopics = async (
  req: ManageRequest, // Using your custom interface here
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;

  // Now typed: topics is string[], actionType is restricted to the enum
  const { topics, targetId, targetModel, actionType } = req.body;

  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return res.status(400).json({
      status: "ERROR",
      message: "A list of topics is required.",
    });
  }

  try {
    const uniqueTitles = [
      ...new Set(topics.map((t) => t.trim().toLowerCase())),
    ];

    /**
     * Atomic Upsert: Ensures global topics exist in the database.
     * Experts use bulkWrite for O(1) database round trips.
     */
    const topicOps = uniqueTitles.map((title) => ({
      updateOne: {
        filter: { title },
        update: { $setOnInsert: { title, userCount: 0, postCount: 0 } },
        upsert: true,
      },
    }));

    await TopicModel.bulkWrite(topicOps);

    // Fetch the hydrated documents (ObjectIds) for the helper functions
    const topicDocs = await TopicModel.find({
      title: { $in: uniqueTitles },
    }).lean();

    // Logic Routing based on actionType
    switch (actionType) {
      case "USER_PREFERENCE":
        if (!userId) {
          return res
            .status(401)
            .json({ status: "ERROR", message: "User not authenticated" });
        }
        await onUserPreferenceSet(userId, topicDocs);
        break;

      case "POST_CREATION":
        if (!targetId || !targetModel) {
          return res.status(400).json({
            status: "ERROR",
            message: "targetId and targetModel are required for POST_CREATION",
          });
        }
        await onPostCreation(targetId, targetModel, topicDocs);
        break;

      case "POST_ENGAGEMENT":
        if (userId) {
          await onPostEngagement(userId, topicDocs);
        }
        break;

      default:
        // TypeScript will actually flag this if you try to pass an invalid string
        return res
          .status(400)
          .json({ status: "ERROR", message: "Invalid actionType" });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Topics processed successfully",
    });
  } catch (error: any) {
    console.error(`[Topic Manager] Error during ${actionType}:`, error);
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Internal server error",
    });
  }
};

/**
 * Attaches new topic IDs to a post and increments global postCount.
 */
async function onPostCreation(
  targetId: string,
  targetModel: string,
  topicDocs: any[],
) {
  const DynamicModel = mongoose.model(targetModel);
  const post = await DynamicModel.findById(targetId).select("topics");

  if (!post) throw new Error(`${targetModel} not found`);

  // topics in GistSchema is an array of ObjectIds
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
      ),
      TopicModel.updateMany(
        { _id: { $in: newTopicIds } },
        { $inc: { postCount: 1 } },
      ),
    ]);
  }
}
/**
 * Updates user preferences with new topics and increments global topic counts.
 */
async function onUserPreferenceSet(
  userId: string | undefined,
  topicDocs: any[],
) {
  if (!userId) throw new Error("User ID is required");

  // 1. Ensure we select 'preferences' to match the schema nesting
  const user = await UserModel.findById(userId).select("preferences");
  if (!user) throw new Error("User not found");

  // 2. Safe navigation using Optional Chaining
  const existingPrefIds = (user.preferences?.preferredTopics || []).map(
    (t: any) => t.topicId.toString(),
  );

  const newTopics = topicDocs.filter(
    (t) => !existingPrefIds.includes(t._id.toString()),
  );

  if (newTopics.length > 0) {
    const newTopicIds = newTopics.map((t) => t._id);

    // 3. FIX: Use the dot notation for nested updates in MongoDB
    await UserModel.updateOne(
      { _id: userId },
      {
        $push: {
          "preferences.preferredTopics": {
            $each: newTopics.map((t) => ({
              topicId: t._id, // Matches your schema key 'topicId'
              title: t.title,
              lastViewed: new Date(),
            })),
          },
        },
      },
    );

    // 4. Update the global topic counts
    await TopicModel.updateMany(
      { _id: { $in: newTopicIds } },
      { $inc: { userCount: 1 } },
    );
  }
}

/**
 * Updates 'lastViewed' for existing topics or adds new ones upon post engagement.
 */
async function onPostEngagement(userId: string | undefined, topicDocs: any[]) {
  if (!userId) return; // Silent return for unauthenticated engagement

  const user = await UserModel.findById(userId).select("preferences");
  if (!user) throw new Error("User not found");

  const preferredTopics = user.preferences?.preferredTopics || [];

  const existingPrefIds = preferredTopics.map((t: any) => t.topicId.toString());

  const toAdd = topicDocs.filter(
    (t) => !existingPrefIds.includes(t._id.toString()),
  );
  const toUpdateDate = topicDocs.filter((t) =>
    existingPrefIds.includes(t._id.toString()),
  );

  // 1. Add topics the user hasn't interacted with yet
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
    );

    // Increment global topic popularity
    await TopicModel.updateMany(
      { _id: { $in: addIds } },
      { $inc: { userCount: 1 } },
    );
  }

  // 2. Refresh lastViewed for topics already in their preference list
  if (toUpdateDate.length > 0) {
    const updateIds = toUpdateDate.map((t) => t._id);

    await UserModel.updateOne(
      { _id: userId },
      {
        $set: { "preferences.preferredTopics.$[elem].lastViewed": new Date() },
      },
      {
        arrayFilters: [{ "elem.topicId": { $in: updateIds } }],
      },
    );
  }
}
