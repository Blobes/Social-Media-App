import { Response } from "express";
import { IAuthRequest, getOrSetCache, CACHE_KEYS } from "@repo/shared";
import mongoose from "mongoose";

interface TranslateReq {
  postId: string;
  caption: string;
  sourceLang: string;
  targetLang: string;
}

// Interface for type-safe Cloudflare Workers AI translation response mapping layout
interface TranslationResult {
  translated_text: string;
}
interface TranslationResponse {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: TranslationResult;
}

/**
 * Translates a dynamic post caption on behalf of an active client feed view.
 */
export const translateCaption = async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  const { postId, caption, sourceLang, targetLang } = req.body as TranslateReq;

  if (!postId || !caption || !sourceLang || !targetLang) {
    res.status(400).json({
      status: "ERROR",
      message:
        "Missing translation target parameters payload context definitions.",
    });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    res.status(400).json({
      status: "ERROR",
      message: "Invalid caption identifier key format.",
    });
    return;
  }

  if (sourceLang.toLowerCase() === targetLang.toLowerCase()) {
    res.status(200).json({
      status: "SUCCESS",
      payload: {
        translatedText: caption,
        fromCache: true,
      },
      message: "Source and target languages match. No translation required.",
    });
    return;
  }

  try {
    const cacheKey = CACHE_KEYS.POST_TRANSLATION(postId, targetLang);
    const CACHE_EXPIRY_SECONDs = 604800;

    const translatedText = await getOrSetCache<string>(
      cacheKey,
      async () => {
        console.log(
          `Cache miss for caption [${postId}] -> [${targetLang}]. Fetching Cloudflare Workers AI...`,
        );

        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        const apiToken = process.env.CLOUDFLARE_AI_TOKEN;

        if (!accountId || !apiToken) {
          throw new Error(
            "Missing Cloudflare network authentication token environment keys.",
          );
        }

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/m2m100-1.2b`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiToken}`,
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
          throw new Error(
            `Cloudflare edge API gateway returned status code: ${response.status}`,
          );
        }

        const payload = (await response.json()) as TranslationResponse;

        if (!payload.success) {
          const apiErrorMessage =
            payload.errors?.[0]?.message ||
            "Cloudflare internal edge inference failure.";
          throw new Error(
            `Cloudflare API execution block exception: ${apiErrorMessage}`,
          );
        }

        const extractedText = payload.result?.translated_text;

        if (!extractedText) {
          throw new Error(
            "Cloudflare payload did not return a valid translation mapping block.",
          );
        }
        return extractedText;
      },
      CACHE_EXPIRY_SECONDs,
    );

    res.status(200).json({
      status: "SUCCESS",
      payload: {
        translatedText,
      },
      message: "Dynamic caption translated successfully.",
    });
  } catch (error: any) {
    console.error(
      `Dynamic caption translation pipeline failure [${postId}]:`,
      error,
    );
    res.status(500).json({
      status: "ERROR",
      message: error.message || "Failed to execute translation operations.",
      payload: null,
    });
  }
};
