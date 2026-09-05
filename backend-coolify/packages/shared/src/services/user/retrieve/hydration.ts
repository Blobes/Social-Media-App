import mongoose from "mongoose";
import { fetchUserSettings } from "../settings";

export interface AdditionsResult {
  language?: string | null;
}

export class UserHydrationService {
  /**
   * Hydrates cross-domain user preferences (e.g., settings, localization).
   */
  static async enrichLanguage(
    userId: mongoose.Types.ObjectId | string,
  ): Promise<AdditionsResult> {
    const settingsDoc = await fetchUserSettings({
      userId: userId.toString(),
      select: "display.localization.language",
    });

    return {
      language: settingsDoc?.display?.localization?.language ?? null,
    };
  }
}
