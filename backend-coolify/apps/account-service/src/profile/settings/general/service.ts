import {
  CACHE_KEYS,
  invalidatePattern,
  UserSettingsResult,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { IUserSettingsDocument, UserSettingsModel } from "@repo/database";
import { DeepPartial, Document } from "mongoose";

export type UpdateSettingsInput = DeepPartial<
  Omit<
    IUserSettingsDocument,
    "_id" | "userId" | "createdAt" | "updatedAt" | keyof Document
  >
>;

export interface IUpdateUserSettingsInput {
  userId: string;
  settings: UpdateSettingsInput;
}

/**
 * Updates partial structural fields in user settings using dot-notation updates to prevent object overwrites.
 */
export const updateUserSettings = async (
  input: IUpdateUserSettingsInput,
): Promise<UserSettingsResult> => {
  const { userId, settings } = input;

  /**
   * Constructs nested dot-notation fields dynamically for partial BSON updates.
   */
  const buildUpdatePayload = (
    obj: Record<string, any>,
    prefix = "",
  ): Record<string, any> => {
    let updates: Record<string, any> = {};

    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        Object.assign(updates, buildUpdatePayload(value, newKey));
      } else {
        updates[newKey] = value;
      }
    }

    return updates;
  };

  const updateFields = buildUpdatePayload(settings);

  const updatedSettings = await UserSettingsModel.findOneAndUpdate(
    { userId },
    { $set: updateFields },
    { new: true, upsert: true, runValidators: true },
  );

  await invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(userId));

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SETTINGS.UPDATED_SUCCESSFULLY,
    payload: { settings: updatedSettings },
  };
};
