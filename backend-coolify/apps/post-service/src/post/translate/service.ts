import mongoose from "mongoose";
import {
  CACHE_KEYS,
  getOrSetCache,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";

export interface TranslateInput {
  postId: string;
  caption: string;
  sourceLang: string;
  targetLang: string;
  cloudflareAccountId?: string;
  cloudflareAiToken?: string;
}

export interface TranslationResult {
  translated_text: string;
}

export interface TranslationResponse {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: TranslationResult;
}

export interface TranslateServiceResult {
  status:
    | "INVALID_PARAMS"
    | "INVALID_ID_FORMAT"
    | "SUCCESS_MATCH"
    | "SUCCESS_TRANSLATED";
  transInfo: TransInfo;
  payload: any;
}

/**
 * Executes dynamic multilingual value parsing by routing localization payloads down to Cloudflare internal proxy infrastructure layers.
 */
export const executeTranslateCaption = async (
  input: TranslateInput,
): Promise<TranslateServiceResult> => {
  const {
    postId,
    caption,
    sourceLang,
    targetLang,
    cloudflareAccountId,
    cloudflareAiToken,
  } = input;

  if (!postId || !caption || !sourceLang || !targetLang) {
    return {
      status: "INVALID_PARAMS",
      transInfo: MESSAGES_REGISTRY.POST.TRANSLATION_MISSING_PARAMS,
      payload: null,
    };
  }

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return {
      status: "INVALID_ID_FORMAT",
      transInfo: MESSAGES_REGISTRY.POST.TRANSLATION_INVALID_CAPTION_ID,
      payload: null,
    };
  }

  if (sourceLang.toLowerCase() === targetLang.toLowerCase()) {
    return {
      status: "SUCCESS_MATCH",
      transInfo: MESSAGES_REGISTRY.POST.TRANSLATION_NOT_REQUIRED,
      payload: {
        translatedText: caption,
        fromCache: true,
      },
    };
  }

  const cacheKey = CACHE_KEYS.POST_TRANSLATION(postId, targetLang);
  const CACHE_EXPIRY_SECONDS = 604800;

  const translatedText = await getOrSetCache<string>(
    cacheKey,
    async () => {
      console.log(
        `Cache miss for caption [${postId}] -> [${targetLang}]. Fetching Cloudflare Workers AI...`,
      );

      if (!cloudflareAccountId || !cloudflareAiToken) {
        throw new Error("MISSING_ENV");
      }

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/ai/run/@cf/meta/m2m100-1.2b`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cloudflareAiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: caption,
            source_lang: sourceLang.toLowerCase(),
            target_lang: targetLang.toLowerCase(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP_ERROR:${response.status}`);
      }

      const payload = (await response.json()) as TranslationResponse;

      if (!payload.success) {
        const apiErrorMessage =
          payload.errors?.[0]?.message ||
          "Cloudflare internal edge inference failure.";
        throw new Error(`API_ERROR:${apiErrorMessage}`);
      }

      const extractedText = payload.result?.translated_text;

      if (!extractedText) {
        throw new Error("MISSING_OUTPUT");
      }

      return extractedText;
    },
    CACHE_EXPIRY_SECONDS,
  );

  return {
    status: "SUCCESS_TRANSLATED",
    transInfo: MESSAGES_REGISTRY.POST.DYNAMIC_CAPTION_TRANSLATED(),
    payload: {
      translatedText,
    },
  };
};
