import {
  IUserPreferredTopic,
  TopicModel,
  UserSettingsModel,
} from "@repo/database";
import { ClientSession } from "mongoose";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { fetchUserSettings } from "../user/settings";
import { UserSettingsResult } from "../../types";

export interface PreferenceTopicInput {
  topicId: string;
  title: string;
}

export interface UserTopicsParams {
  userId: string;
  topics: PreferenceTopicInput[];
  mode?: "ADD" | "REMOVE";
  updateMetadata?: boolean;
  session?: ClientSession;
}

/**
 * Updates user topic preferences based on operational mode and metadata options.
 */
export const executeUserTopicsSync = async (
  params: UserTopicsParams,
): Promise<UserSettingsResult> => {
  const {
    userId,
    topics,
    mode = "ADD",
    updateMetadata = false,
    session,
  } = params;

  if (!userId) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.PROFILE.UNAUTHENTICATED_PREFERENCE_UPDATE,
    };
  }

  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.POST.POST_TOPICS_LIST_REQUIRED,
    };
  }

  const userSettings = await fetchUserSettings({
    userId,
    select: "display.contentPreferences.preferredTopics",
    session,
  });

  const existingPrefIds = new Set(
    (userSettings?.display?.contentPreferences?.preferredTopics || []).map(
      (t: IUserPreferredTopic) => t.topicId.toString(),
    ),
  );

  const toAdd: PreferenceTopicInput[] = [];
  const toRemoveIds: string[] = [];
  const toUpdateMetadataIds: string[] = [];

  for (const topic of topics) {
    const exists = existingPrefIds.has(topic.topicId);

    if (mode === "REMOVE") {
      if (exists) {
        toRemoveIds.push(topic.topicId);
      }
    } else if (mode === "ADD") {
      if (!exists) {
        toAdd.push(topic);
      }
    }

    // Process standalone metadata updates independently from topic addition
    if (updateMetadata && exists) {
      toUpdateMetadataIds.push(topic.topicId);
    }
  }

  const bulkOps: Promise<unknown>[] = [];

  // Add missing topics to user preferences and update total count
  if (toAdd.length > 0) {
    const addIds = toAdd.map((t) => t.topicId);
    bulkOps.push(
      UserSettingsModel.updateOne(
        { userId },
        {
          $push: {
            "display.contentPreferences.preferredTopics": {
              $each: toAdd.map((t) => ({
                topicId: t.topicId,
                title: t.title,
                lastViewed: new Date(),
              })),
            },
          },
        },
        { session },
      ),
      TopicModel.updateMany(
        { _id: { $in: addIds } },
        { $inc: { userCount: 1 } },
        { session },
      ),
    );
  }

  // Remove existing topics from user preferences and update total count
  if (toRemoveIds.length > 0) {
    bulkOps.push(
      UserSettingsModel.updateOne(
        { userId },
        {
          $pull: {
            "display.contentPreferences.preferredTopics": {
              topicId: { $in: toRemoveIds },
            },
          },
        },
        { session },
      ),
      TopicModel.updateMany(
        { _id: { $in: toRemoveIds } },
        { $inc: { userCount: -1 } },
        { session },
      ),
    );
  }

  // Update lastViewed timestamp for targeted topics
  if (toUpdateMetadataIds.length > 0) {
    bulkOps.push(
      UserSettingsModel.updateOne(
        { userId },
        {
          $set: {
            "display.contentPreferences.preferredTopics.$[elem].lastViewed":
              new Date(),
          },
        },
        {
          arrayFilters: [{ "elem.topicId": { $in: toUpdateMetadataIds } }],
          session,
        },
      ),
    );
  }

  if (bulkOps.length > 0) {
    await Promise.all(bulkOps);
  }

  const updatedSettingsResult = await fetchUserSettings({
    userId,
    select: "display.contentPreferences.preferredTopics",
    session,
  });

  const updatedTopics =
    updatedSettingsResult?.display?.contentPreferences?.preferredTopics || [];

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SETTINGS.UPDATED_SUCCESSFULLY,
    payload: updatedTopics,
  };
};

/**
 * Drops targeted topics profiles from a specific user preferred preference sequence.
 */
export const removeTopicsFromUser = async (
  userId: string,
  topicIds: string[],
  session?: ClientSession,
): Promise<UserSettingsResult> => {
  if (!topicIds || !Array.isArray(topicIds)) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.POST.POST_TOPIC_IDS_REQUIRED,
      payload: null,
    };
  }

  if (!topicIds.length) {
    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.POST.POST_USER_TOPICS_REMOVED_SUCCESSFULLY,
      payload: null,
    };
  }

  const settingsUpdate = await UserSettingsModel.updateOne(
    { userId },
    {
      $pull: {
        "display.contentPreferences.preferredTopics": {
          topicId: { $in: topicIds },
        },
      },
    },
    { session },
  );

  if (settingsUpdate.modifiedCount > 0) {
    await Promise.all([
      TopicModel.updateMany(
        { _id: { $in: topicIds } },
        { $inc: { userCount: -1 } },
        { session },
      ),
    ]);
  }

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.POST.POST_USER_TOPICS_REMOVED_SUCCESSFULLY,
    payload: null,
  };
};
