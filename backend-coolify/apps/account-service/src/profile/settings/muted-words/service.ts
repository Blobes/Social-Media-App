import { UserSettingsResult, MESSAGES_REGISTRY } from "@repo/shared";
import { UserSettingsModel } from "@repo/database";

export interface IMutedWordsInput {
  userId: string;
  words: string[];
}

/**
 * Appends unique normalized phrases to the user's content mute list.
 */
export const executeAddMutedWords = async (
  input: IMutedWordsInput,
): Promise<UserSettingsResult> => {
  const { userId, words } = input;

  const normalizedWords = words
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 0);

  if (normalizedWords.length === 0) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.SETTINGS.INVALID_MUTED_WORDS_PAYLOAD,
    };
  }

  const updatedSettings = await UserSettingsModel.findOneAndUpdate(
    { userId },
    {
      $addToSet: {
        "display.contentPreferences.mutedWords": {
          $each: normalizedWords,
        },
      },
    },
    { new: true, upsert: true },
  );

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SETTINGS.MUTED_WORDS_UPDATED,
    payload: { settings: updatedSettings },
  };
};

/**
 * Removes target phrases from the user's content mute list.
 */
export const removeMutedWords = async (
  input: IMutedWordsInput,
): Promise<UserSettingsResult> => {
  const { userId, words } = input;

  const normalizedWords = words.map((word) => word.trim().toLowerCase());

  const updatedSettings = await UserSettingsModel.findOneAndUpdate(
    { userId },
    {
      $pull: {
        "display.contentPreferences.mutedWords": {
          $in: normalizedWords,
        },
      },
    },
    { new: true },
  );

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SETTINGS.MUTED_WORDS_UPDATED,
    payload: { settings: updatedSettings! },
  };
};
