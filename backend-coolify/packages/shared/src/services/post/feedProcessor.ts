import { IBasePost, TransInfo } from "../../types";
import {
  UserModel,
  BlockedModel,
  IUserPreferredTopic,
  ILocation,
} from "@repo/database";
import { getOrSetCacheSet } from "../redis/cache";
import { CACHE_KEYS } from "../../constants/cacheKeys";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { getUserSettings, GetUserSettingsResult } from "../user/settings";
import { calculateLocationScore } from "../../utils/calculations";

export interface UserPreferencesResult {
  userId: string;
  location?: ILocation | null;
  settings: GetUserSettingsResult;
  blockedUserIds: string[];
}

export interface PersonalizeFeedResult<T extends IBasePost> {
  status: "SUCCESS" | "INVALID_INPUT" | "NOT_FOUND" | "SERVER_ERROR";
  transInfo: TransInfo;
  payload: T[];
}

/**
 * Fetches user profile, blocked list, and application settings required for feed personalization.
 */
export const getUserPreferences = async (
  userId: string,
): Promise<UserPreferencesResult> => {
  // Parallel fetch: DB Profile + User Settings + Redis Block List
  const [user, settingsResult, blockedUserIds] = await Promise.all([
    UserModel.findById(userId)
      .select("location username firstName lastName")
      .lean(),
    getUserSettings({ userId }),
    getOrSetCacheSet(CACHE_KEYS.USER_BLOCKINGS(userId), async () => {
      const docs = await BlockedModel.find({ blockerId: userId })
        .select("blockedId")
        .lean();
      return docs.map((d) => String(d.blockedId));
    }),
  ]);

  return {
    userId,
    location: user?.location,
    settings: settingsResult,
    blockedUserIds,
  };
};

/**
 * Ranks and filters generic posts based on user topic preferences, location matching, and moderation settings.
 */
export const personalizeFeed = async <T extends IBasePost>(
  posts: T[],
  userId: string,
): Promise<PersonalizeFeedResult<T>> => {
  if (!userId) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      payload: posts,
    };
  }

  const userPrefs = await getUserPreferences(userId);

  // Fallback to raw post sequence if settings retrieval failed
  if (userPrefs.settings.status !== "SUCCESS") {
    return {
      status: userPrefs.settings.status,
      transInfo: userPrefs.settings.transInfo,
      payload: posts,
    };
  }

  const userLocationName = userPrefs.location?.name?.toLowerCase();

  // Extract preferences directly from settings document
  const settingsDoc = userPrefs.settings.payload;
  const displayPrefs = settingsDoc?.display;

  const preferredTopics: IUserPreferredTopic[] =
    displayPrefs?.contentPreferences?.preferredTopics || [];
  const preferredTopicIds = new Set(
    preferredTopics.map((t) => String(t.topicId)),
  );

  const showSensitiveMedia = displayPrefs?.showSensitiveMedia ?? false;

  const personalizedPosts = posts
    .filter((post) => {
      // Safety Filter: Blocked Authors
      if (userPrefs.blockedUserIds.includes(String(post.authorId))) {
        return false;
      }

      // Safety Filter: Sensitive Graphics
      if (post.hasSensitiveGraphic && !showSensitiveMedia) {
        return false;
      }

      return true;
    })
    .map((post) => {
      let score = 0;

      // Topic Intersection Scoring (+10 if any topic matches preferred topics)
      if (post.topics && Array.isArray(post.topics)) {
        const hasTopicMatch = post.topics.some((topicId) =>
          preferredTopicIds.has(String(topicId)),
        );
        if (hasTopicMatch) score += 10;
      }

      // // Location Scoring (+5 if post location matches user location)
      // const postLocationName = post.location?.name?.toLowerCase();
      // if (userLocationName && postLocationName === userLocationName) {
      //   score += 5;
      // }

      // Proximity Location Scoring (+2 to +8 based on distance radius)
      score += calculateLocationScore(userPrefs.location, post.location);

      return { post, score };
    })
    // Sort by descending score
    .sort((a, b) => b.score - a.score)
    // Unwrap original post
    .map((wrapper) => wrapper.post);

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SETTINGS.FETCHED_SUCCESSFULLY,
    payload: personalizedPosts,
  };
};
