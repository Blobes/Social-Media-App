import { IBasePost, IUserPreferences } from "../../types/types";
import { UserModel, BlockedModel } from "@repo/database";
import { getOrSetCacheSet } from "../redis/cache";

/**
 * personalizeFeed: A generic ranking engine for all post types.
 * Handles array-based topic matching and nested location scoring.
 */
export const personalizeFeed = <T extends IBasePost>(
  posts: T[],
  userPrefs: IUserPreferences,
): T[] => {
  // 1. Pre-process preferences for O(1) lookups
  // We use a Set of strings to compare against post topic IDs quickly
  const preferredTopicIds = new Set(
    userPrefs.preferredTopics.map((t) => String(t.topicId)),
  );

  const userLocationName = userPrefs.location?.toLowerCase();

  return (
    posts
      .filter((post) => {
        // 2. Safety Filter: Blocked Authors
        // Ensure post.authorId is cast to string to match the block list
        if (userPrefs.blockedUserIds?.includes(String(post.authorId))) {
          return false;
        }

        // 3. Safety Filter: Sensitive Graphics (Blur/Hide logic)
        if (post.hasSensitiveGraphic && !userPrefs.showSensitiveGraphic) {
          return false;
        }

        return true;
      })
      .map((post) => {
        let score = 0;

        // 4. Topic Intersection Scoring (+10 if any match)
        // Since 'topics' is an array of ObjectIds in your schema
        if (post.topics && Array.isArray(post.topics)) {
          const hasTopicMatch = post.topics.some((topicId) =>
            preferredTopicIds.has(String(topicId)),
          );
          if (hasTopicMatch) score += 10;
        }

        // 5. Location Scoring (+5)
        // Accesses post.location.name based on your GistSchema
        const postLocationName = post.location?.toLowerCase();
        if (userLocationName && postLocationName === userLocationName) {
          score += 5;
        }

        return { post, score };
      })
      // 6. Sort by descending score
      .sort((a, b) => b.score - a.score)
      // 7. Unwrap the original post type T
      .map((wrapper) => wrapper.post)
  );
};

// Get feed user data
export const getFeedUserContext = async (
  userId: string,
  jwtUser?: any,
): Promise<IUserPreferences> => {
  // Parallel fetch: DB Preferences + Redis Block List
  const [userDoc, blockedUserIds] = await Promise.all([
    UserModel.findById(userId)
      .select("preferences location username firstName lastName")
      .lean(),
    getOrSetCacheSet(`user:${userId}:blocks`, async () => {
      const docs = await BlockedModel.find({ blockerId: userId })
        .select("blockedId")
        .lean();
      return docs.map((d) => String(d.blockedId));
    }),
  ]);

  // Handle the "preferredTopics" mapping to convert ObjectIds to strings
  const preferredTopics = (userDoc?.preferences?.preferredTopics || []).map(
    (t: any) => ({
      topicId: String(t.topicId), // Explicitly cast ObjectId to string
      title: t.title || "Unknown", // Provide a fallback for the string type
      lastViewed: t.lastViewed,
    }),
  );

  return {
    userId: String(userId),
    username: userDoc?.username || jwtUser?.username || "",
    firstName: userDoc?.firstName || jwtUser?.firstName || "",
    lastName: userDoc?.lastName || jwtUser?.lastName || "",
    location: userDoc?.location || null,
    preferredTopics,
    showSensitiveGraphic: userDoc?.preferences?.showSensitiveGraphic || false,
    blockedUserIds: blockedUserIds,
  };
};
