import { IUserSettingsDocument, UserSettingsModel } from "@repo/database";
import { ClientSession } from "mongoose";
import { getOrSetCache } from "../redis/cache";
import { CACHE_KEYS, CACHE_EXPIRY } from "../../constants/cacheKeys";
import { MESSAGES_REGISTRY } from "../../constants/msgRegistry";
import { TransInfo } from "../../types";

export interface GetUserSettingsInput {
  userId: string;
  select?: string;
  session?: ClientSession;
}

export interface GetUserSettingsResult {
  status: "SUCCESS" | "NOT_FOUND" | "INVALID_INPUT";
  transInfo: TransInfo;
  payload?: IUserSettingsDocument | null;
}

export interface UserSettingsResult extends GetUserSettingsResult {
  payload?: any;
}

/**
 * Retrieves global user settings or initializes default settings if none exist, utilizing cached layer.
 */
export const getUserSettings = async (
  input: GetUserSettingsInput,
): Promise<GetUserSettingsResult> => {
  const { userId, select, session } = input;

  if (!userId) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.PROFILE.UNAUTHENTICATED_PREFERENCE_UPDATE,
    };
  }

  // Bypass cache when active session or explicit query select projections are required
  if (session || select) {
    let query = UserSettingsModel.findOne({ userId }).session(session || null);
    if (select) {
      query = query.select(select);
    }

    let doc = await query;
    if (!doc) {
      const [createdDoc] = await UserSettingsModel.create([{ userId }], {
        session,
      });
      doc = createdDoc;
    }

    return {
      status: "SUCCESS",
      transInfo: MESSAGES_REGISTRY.SETTINGS.FETCHED_SUCCESSFULLY,
      payload: { ...doc },
    };
  }

  const cacheKey = CACHE_KEYS.USER_PREFERENCES(userId);

  const settings = await getOrSetCache(
    cacheKey,
    async () => {
      let doc = await UserSettingsModel.findOne({ userId });
      if (!doc) {
        doc = await UserSettingsModel.create({ userId });
      }
      return doc;
    },
    CACHE_EXPIRY.DAY_7,
  );

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SETTINGS.FETCHED_SUCCESSFULLY,
    payload: { ...settings },
  };
};
