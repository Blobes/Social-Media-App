import crypto from "crypto";
import mongoose, { ClientSession } from "mongoose";
import { TopicModel, UserModel } from "@repo/database";
import { TransInfo } from "../types";
import { CACHE_KEYS, getOrSetCache } from "../utils/redis/cache";
import { MESSAGES_REGISTRY } from "../constants/msgRegistry";

export interface ManageTopicsParams {
  topics: string[];
  userId?: string;
  targetId?: string;
  targetModel?: "Gist" | "Stake" | "User";
  actionType: "USER_PREFERENCE" | "POST_CREATION_OR_UPDATE" | "POST_ENGAGEMENT";
}
export interface RemoveTopicsFromUserResult {
  status: "INVALID_INPUT" | "SUCCESS";
  transInfo: TransInfo;
  payload: null;
}
export interface ManageTopicsResult {
  status: "INVALID_INPUT" | "SUCCESS";
  transInfo: TransInfo;
  payload: any[];
}
export interface PruneUnusedTopicsResult {
  status: "INVALID_INPUT" | "SUCCESS";
  transInfo: TransInfo;
  payload: {
    deletedCount: number;
  };
}

export interface LookupTopicsInput {
  keyword?: string;
  alreadySelected?: string[];
  page: number;
  limit: number;
}

export interface LookupTopicsResult {
  status: "SUCCESS";
  transInfo: TransInfo;
  payload: any[];
  metaData: {
    totalDocs: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
  };
}

/**
 * Attaches new topic IDs to a post and increments global postCount.
 */
export const handlePostCreationTopics = async (
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
 * Updates user preferences with new topics and increments global topic counts.
 */
export const handleUserPreferenceTopics = async (
  userId: string,
  topicDocs: any[],
  session?: ClientSession,
): Promise<void> => {
  const user = await UserModel.findById(userId)
    .session(session || null)
    .select("preferences");

  if (!user) {
    throw new Error(MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND.message);
  }

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
): Promise<void> => {
  const user = await UserModel.findById(userId)
    .session(session || null)
    .select("preferences");

  if (!user) {
    throw new Error(MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND.message);
  }

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
): Promise<ManageTopicsResult> => {
  const { topics, userId, targetId, targetModel, actionType } = params;

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
    case "USER_PREFERENCE":
      if (!userId) {
        throw new Error(
          MESSAGES_REGISTRY.PROFILE.UNAUTHENTICATED_PREFERENCE_UPDATE.message,
        );
      }
      await handleUserPreferenceTopics(userId, topicDocs, session);
      break;

    case "POST_CREATION_OR_UPDATE":
      if (!targetId || !targetModel) {
        throw new Error(
          MESSAGES_REGISTRY.POST.MISSING_POST_PROCESSING_PARAMS.message,
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

/**
 * Standard cleanup system targeting topics without remaining active entity bindings.
 */
export const pruneDeadTopics = async (
  topicIds: string[],
): Promise<PruneUnusedTopicsResult> => {
  if (!topicIds || !Array.isArray(topicIds)) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.POST.POST_TOPIC_IDS_REQUIRED,
      payload: { deletedCount: 0 },
    };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const query: any = {
    userCount: 0,
    postCount: 0,
    createdAt: { $lt: thirtyDaysAgo },
  };

  if (topicIds.length > 0) {
    query._id = { $in: topicIds };
  }

  const result = await TopicModel.deleteMany(query);

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.POST_TOPICS_PRUNED(result.deletedCount),
    payload: { deletedCount: result.deletedCount },
  };
};

/**
 * Drops targeted topics profiles from a specific user preferred preference sequence.
 */
export const removeTopicsFromUser = async (
  userId: string,
  staleTopicIds: string[],
): Promise<RemoveTopicsFromUserResult> => {
  if (!staleTopicIds || !Array.isArray(staleTopicIds)) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.POST.POST_TOPIC_IDS_REQUIRED,
      payload: null,
    };
  }

  if (!staleTopicIds.length) {
    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.POST.POST_USER_TOPICS_REMOVED_SUCCESSFULLY,
      payload: null,
    };
  }

  const userUpdate = await UserModel.updateOne(
    { _id: userId },
    {
      $pull: {
        "preferences.preferredTopics": { topicId: { $in: staleTopicIds } },
      },
    },
  );

  if (userUpdate.modifiedCount > 0) {
    await TopicModel.updateMany(
      { _id: { $in: staleTopicIds } },
      { $inc: { userCount: -1 } },
    );
  }

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.POST_USER_TOPICS_REMOVED_SUCCESSFULLY,
    payload: null,
  };
};

/**
 * Executes paginated calculations across cache lookups and indexed database queries to evaluate matches for topic categories.
 */
export const executeLookupTopics = async (
  input: LookupTopicsInput,
): Promise<LookupTopicsResult> => {
  const { keyword, alreadySelected = [], page, limit } = input;
  const skip = (page - 1) * limit;
  const cleanKeyword = keyword ? keyword.trim() : "";

  const exclusionHash = crypto
    .createHash("md5")
    .update([...alreadySelected].sort().join(","))
    .digest("hex");

  const cacheKey = CACHE_KEYS.TOPICS_LOOKUP(
    cleanKeyword,
    exclusionHash,
    page,
    limit,
  );

  const { topics, totalCount } = await getOrSetCache(
    cacheKey,
    async () => {
      const filter: any = {
        title: { $nin: alreadySelected },
      };

      if (cleanKeyword !== "") {
        filter.title = {
          ...filter.title,
          $regex: cleanKeyword,
          $options: "i",
        };
      }

      const total = await TopicModel.countDocuments(filter);
      let databaseQuery = TopicModel.find(filter);

      if (cleanKeyword !== "") {
        databaseQuery = databaseQuery.sort({ postCount: -1 });
      } else {
        databaseQuery = databaseQuery.sort({ postCount: -1, createdAt: -1 });
      }

      const data = await databaseQuery.skip(skip).limit(limit);
      return { topics: data, totalCount: total };
    },
    300,
  );

  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.POST_TOPICS_FETCHED_SUCCESS,
    payload: topics ?? [],
    metaData: {
      totalDocs: totalCount,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage,
    },
  };
};
