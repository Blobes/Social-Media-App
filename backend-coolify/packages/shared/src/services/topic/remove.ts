import { UserModel, TopicModel } from "@repo/database";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { TransInfo } from "../../types";

export interface RemoveTopicsFromUserResult {
  status: "INVALID_INPUT" | "SUCCESS";
  transInfo: TransInfo;
  payload: null;
}

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
