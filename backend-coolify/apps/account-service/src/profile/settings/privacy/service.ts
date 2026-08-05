import { UserSettingsModel } from "@repo/database";
import { UserSettingsResult, MESSAGES_REGISTRY } from "@repo/shared";
import { ClientSession } from "mongoose";

export interface PrivacySettingsInput {
  userId: string;
  isPrivateAccount?: boolean;
  discoverability?: {
    searchIndexing?: boolean;
    contactSync?: boolean;
    recommendToOthers?: boolean;
  };
  directMessaging?: "EVERYONE" | "FOLLOWERS" | "NO_ONE";
  mentionsAndTagging?: "EVERYONE" | "FOLLOWERS" | "NO_ONE";
  session?: ClientSession;
}

/**
 * Updates user privacy configurations atomically without overwriting adjacent fields.
 */
export const executeUpdatePrivacySettings = async (
  input: PrivacySettingsInput,
): Promise<UserSettingsResult> => {
  const {
    userId,
    isPrivateAccount,
    discoverability,
    directMessaging,
    mentionsAndTagging,
    session,
  } = input;

  if (!userId) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.PROFILE.UNAUTHENTICATED_PREFERENCE_UPDATE,
    };
  }

  const updateOps: Record<string, unknown> = {};

  if (typeof isPrivateAccount === "boolean") {
    updateOps["privacy.isPrivateAccount"] = isPrivateAccount;
  }

  if (discoverability) {
    if (typeof discoverability.searchIndexing === "boolean") {
      updateOps["privacy.discoverability.searchIndexing"] =
        discoverability.searchIndexing;
    }
    if (typeof discoverability.contactSync === "boolean") {
      updateOps["privacy.discoverability.contactSync"] =
        discoverability.contactSync;
    }
    if (typeof discoverability.recommendToOthers === "boolean") {
      updateOps["privacy.discoverability.recommendToOthers"] =
        discoverability.recommendToOthers;
    }
  }

  if (directMessaging) {
    updateOps["privacy.directMessaging"] = directMessaging;
  }

  if (mentionsAndTagging) {
    updateOps["privacy.mentionsAndTagging"] = mentionsAndTagging;
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
    .select("privacy")
    .lean();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SETTINGS.UPDATED_SUCCESSFULLY,
    payload: { privacy: updatedSettings?.privacy },
  };
};
