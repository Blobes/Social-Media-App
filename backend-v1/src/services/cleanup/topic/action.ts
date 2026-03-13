import { TopicModel } from "@/models/topic";
import { UserModel } from "@/models/user/user";

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
