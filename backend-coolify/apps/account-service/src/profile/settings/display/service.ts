import { UserSettingsModel } from "@repo/database";
import {
  CACHE_KEYS,
  invalidatePattern,
  UserSettingsResult,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { ClientSession } from "mongoose";

export interface DisplaySettingsInput {
  userId: string;
  theme?: "SYSTEM" | "LIGHT" | "DARK";
  showSensitiveMedia?: boolean;
  accessibility?: {
    reduceMotion?: boolean;
    highContrast?: boolean;
    fontScale?: number;
    autoPlayMedia?: "ALWAYS" | "WIFI_ONLY" | "NEVER";
  };
  localization?: {
    language?: string;
    region?: string;
    currency?: string;
  };
  session?: ClientSession;
}

/**
 * Updates UI, accessibility, and localization display options.
 */
export const updateDisplaySettings = async (
  input: DisplaySettingsInput,
): Promise<UserSettingsResult> => {
  const {
    userId,
    theme,
    showSensitiveMedia,
    accessibility,
    localization,
    session,
  } = input;

  if (!userId) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.PROFILE.UNAUTHENTICATED_PREFERENCE_UPDATE,
    };
  }

  const updateOps: Record<string, unknown> = {};

  if (theme) {
    updateOps["displayAndApp.theme"] = theme;
  }

  if (typeof showSensitiveMedia === "boolean") {
    updateOps["displayAndApp.showSensitiveMedia"] = showSensitiveMedia;
  }

  if (accessibility) {
    if (typeof accessibility.reduceMotion === "boolean") {
      updateOps["displayAndApp.accessibility.reduceMotion"] =
        accessibility.reduceMotion;
    }
    if (typeof accessibility.highContrast === "boolean") {
      updateOps["displayAndApp.accessibility.highContrast"] =
        accessibility.highContrast;
    }
    if (typeof accessibility.fontScale === "number") {
      updateOps["displayAndApp.accessibility.fontScale"] =
        accessibility.fontScale;
    }
    if (accessibility.autoPlayMedia) {
      updateOps["displayAndApp.accessibility.autoPlayMedia"] =
        accessibility.autoPlayMedia;
    }
  }

  if (localization) {
    if (localization.language) {
      updateOps["displayAndApp.localization.language"] = localization.language;
    }
    if (localization.region) {
      updateOps["displayAndApp.localization.region"] = localization.region;
    }
    if (localization.currency) {
      updateOps["displayAndApp.localization.currency"] = localization.currency;
    }
  }

  if (Object.keys(updateOps).length === 0) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.SETTINGS.NO_UPDATE_FIELDS_PROVIDED,
    };
  }

  const updatedSettings = await UserSettingsModel.findOneAndUpdate(
    { userId },
    { $set: updateOps },
    { new: true, upsert: true, runValidators: true, session },
  )
    .select(
      "displayAndApp.theme displayAndApp.showSensitiveMedia displayAndApp.accessibility displayAndApp.localization",
    )
    .lean();

  await invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(userId));

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SETTINGS.UPDATED_SUCCESSFULLY,
    payload: { displayAndApp: updatedSettings?.display },
  };
};
