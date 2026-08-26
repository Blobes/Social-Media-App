import { IBasePost, TransInfo } from "../../../types/general";
import { BlockedModel, ILocation } from "@repo/database";
import { getOrSetCacheSet } from "../../redis/cache/helpers";
import { CACHE_KEYS } from "../../../constants/cacheKeys";
import {
  fetchUserSettings,
  FetchUserSettingsResult,
} from "../../user/settings";
import { fetchSingleUser } from "../../user/retrieval/fetchUser";

export interface PersonalizeFeedResult<T extends IBasePost> {
  status: "SUCCESS" | "INVALID_INPUT" | "NOT_FOUND" | "SERVER_ERROR";
  transInfo: TransInfo;
  payload: T[];
}

export interface UserPreferencesResult {
  userId: string;
  location?: ILocation | null;
  settings: FetchUserSettingsResult;
  blockedUserIds: string[];
  mutedWords: string[];
}

/**
 * Fetches user profile, blocked list, muted words, and settings for feed candidate generation.
 */
export const getUserPreferences = async (
  userId: string,
): Promise<UserPreferencesResult> => {
  const [user, settingsResult, blockedUserIds] = await Promise.all([
    fetchSingleUser({
      identifier: userId,
      select: ["location"],
      flags: { lean: true, skipFilter: true },
    }),
    fetchUserSettings({ userId }),
    getOrSetCacheSet(CACHE_KEYS.USER_BLOCKINGS(userId), async () => {
      const docs = await BlockedModel.find({ blockerId: userId })
        .select("blockedId")
        .lean();
      return docs.map((d) => String(d.blockedId));
    }),
  ]);

  const displayPrefs = settingsResult?.display;
  const mutedWords = displayPrefs?.contentPreferences?.mutedWords || [];

  return {
    userId,
    location: user?.location,
    settings: settingsResult,
    blockedUserIds,
    mutedWords,
  };
};
