import { TopicModel, UserModel } from "@repo/database";
import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../../middlewares/verifyAuthToken";

interface ManageRequest extends AuthRequest {
  body: {
    topics: string[];
    targetId?: string;
    targetModel?: "Gist" | "Stake" | "User";
    actionType: "USER_PREFERENCE" | "POST_CREATION" | "POST_ENGAGEMENT";
  };
}

export const manageTopics = async (
  req: ManageRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;
  const { topics, targetId, targetModel, actionType } = req.body;

  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return res
      .status(400)
      .json({ status: "ERROR", message: "A list of topics is required." });
  }

  try {
    const uniqueTitles = [
      ...new Set(topics.map((t) => t.trim().toLowerCase())),
    ];

    // Ensure Global Topics exist using Atomic Upsert
    const topicOps = uniqueTitles.map((title) => ({
      updateOne: {
        filter: { title },
        update: { $setOnInsert: { title, userCount: 0, postCount: 0 } },
        upsert: true,
      },
    }));

    await TopicModel.bulkWrite(topicOps);

    // Fetch the actual documents to get ObjectIds and standardized titles
    const topicDocs = await TopicModel.find({ title: { $in: uniqueTitles } });

    // ROUTE SELECTION
    if (actionType === "USER_PREFERENCE") {
      await handleUserPreference(userId, topicDocs);
    } else if (actionType === "POST_CREATION") {
      if (!targetId || !targetModel) {
        return res.status(400).json({
          status: "ERROR",
          message: "targetId and targetModel are required for POST_CREATION",
        });
      }
      await handlePostCreation(targetId, targetModel, topicDocs);
    } else if (actionType === "POST_ENGAGEMENT") {
      await handlePostEngagement(userId, topicDocs);
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Topics processed successfully",
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Helper: Handle Post Topic Creation (Generic for Gists, Articles, etc.)
async function handlePostCreation(
  targetId: string,
  targetModel: string,
  topicDocs: any[],
) {
  const DynamicModel = mongoose.model(targetModel);
  const post = await DynamicModel.findById(targetId).select("topics");

  if (!post) throw new Error(`${targetModel} not found`);

  // Filter out topics already present in the post
  const existingPostTopicIds = post.topics.map((t: any) => t._id.toString());
  const newTopicsForPost = topicDocs.filter(
    (t) => !existingPostTopicIds.includes(t._id.toString()),
  );

  if (newTopicsForPost.length > 0) {
    const newIds = newTopicsForPost.map((t) => t._id);

    // Update the Post document
    await DynamicModel.updateOne(
      { _id: targetId },
      {
        $push: {
          topics: {
            $each: newTopicsForPost.map((t) => ({
              _id: t._id,
              title: t.title,
            })),
          },
        },
      },
    );

    // Increment global postCount for these topics
    await TopicModel.updateMany(
      { _id: { $in: newIds } },
      { $inc: { postCount: 1 } },
    );
  }
}

// Helper: Handle User Preferences (Onboarding/Manual Profile Update)
async function handleUserPreference(
  userId: string | undefined,
  topicDocs: any[],
) {
  const user = await UserModel.findById(userId).select("preferredTopics");
  if (!user) throw new Error("User not found");

  const existingPrefIds = user.preferredTopics.map((t: any) =>
    t._id.toString(),
  );
  const newTopics = topicDocs.filter(
    (t) => !existingPrefIds.includes(t._id.toString()),
  );

  if (newTopics.length > 0) {
    const newIds = newTopics.map((t) => t._id);
    await UserModel.updateOne(
      { _id: userId },
      {
        $push: {
          preferredTopics: {
            $each: newTopics.map((t) => ({
              _id: t._id,
              title: t.title,
              lastViewed: new Date(),
            })),
          },
        },
      },
    );
    await TopicModel.updateMany(
      { _id: { $in: newIds } },
      { $inc: { userCount: 1 } },
    );
  }
}

// Helper: Handle User Engagement (Updates lastViewed or Adds missing topics)
async function handlePostEngagement(
  userId: string | undefined,
  topicDocs: any[],
) {
  const user = await UserModel.findById(userId).select("preferredTopics");
  if (!user) throw new Error("User not found");

  const existingPrefIds = user.preferredTopics.map((t: any) =>
    t._id.toString(),
  );
  const toAdd = topicDocs.filter(
    (t) => !existingPrefIds.includes(t._id.toString()),
  );
  const toUpdateDate = topicDocs.filter((t) =>
    existingPrefIds.includes(t._id.toString()),
  );

  // 1. Add topics the user doesn't have yet
  if (toAdd.length > 0) {
    const addIds = toAdd.map((t) => t._id);
    await UserModel.updateOne(
      { _id: userId },
      {
        $push: {
          preferredTopics: {
            $each: toAdd.map((t) => ({
              _id: t._id,
              title: t.title,
              lastViewed: new Date(),
            })),
          },
        },
      },
    );
    await TopicModel.updateMany(
      { _id: { $in: addIds } },
      { $inc: { userCount: 1 } },
    );
  }

  // 2. Refresh lastViewed for topics user already has
  if (toUpdateDate.length > 0) {
    const updateIds = toUpdateDate.map((t) => t._id);
    await UserModel.updateOne(
      { _id: userId },
      { $set: { "preferredTopics.$[elem].lastViewed": new Date() } },
      { arrayFilters: [{ "elem._id": { $in: updateIds } }] },
    );
  }
}
