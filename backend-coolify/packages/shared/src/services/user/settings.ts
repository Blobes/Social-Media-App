import { IUserSettingsDocument, UserSettingsModel } from "@repo/database";
import { ClientSession } from "mongoose";
import { CACHE_KEYS, CACHE_EXPIRY } from "../../constants/cacheKeys";
import { getOrSetCache } from "../redis/cache/helpers";

export interface FetchUserSettingsInput {
  userId: string;
  select?: string;
  session?: ClientSession;
}

export type FetchUserSettingsResult = Partial<IUserSettingsDocument> | null;

/**
 * Retrieves global user settings utilizing a lean cached layer.
 */
export const fetchUserSettings = async (
  input: FetchUserSettingsInput,
): Promise<FetchUserSettingsResult> => {
  const { userId, select, session } = input;

  if (!userId) return null;

  // Helper to extract specific fields from an object if select is provided
  const applySelection = (
    doc: Record<string, any> | null,
    selectStr?: string,
  ) => {
    if (!doc || !selectStr) return doc;
    const fields = selectStr.split(/\s+/).filter(Boolean);
    const selectedDoc: Record<string, any> = {};

    fields.forEach((field) => {
      if (field in doc) {
        selectedDoc[field] = doc[field];
      }
    });
    return selectedDoc;
  };

  // Direct database query when an active session is required
  if (session) {
    let query = UserSettingsModel.findOne({ userId }).lean().session(session);

    if (select) {
      query = query.select(select);
    }

    return await query;
  }

  // Redis Cache Path: Always cache full lean object, project fields in-memory
  const cacheKey = CACHE_KEYS.USER_PREFERENCES(userId);

  const fullSettings = await getOrSetCache(
    cacheKey,
    async () => {
      const doc = await UserSettingsModel.findOne({ userId }).lean();

      // Default fallback in memory without write-on-read overhead
      if (!doc) {
        return { userId, preferredLanguage: "en" };
      }

      return doc;
    },
    CACHE_EXPIRY.DAY_7,
  );

  return applySelection(fullSettings, select);
};
