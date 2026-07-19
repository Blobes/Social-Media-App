import { Response, NextFunction } from "express";
import {
  IAuthRequest,
  MESSAGES_REGISTRY,
  TransInfo,
  forwardError,
} from "@repo/shared";
import { executeTranslateCaption } from "./service";

interface TranslateReq {
  postId: string;
  caption: string;
  sourceLang: string;
  targetLang: string;
}

/**
 * Controller endpoint to manage request routing configurations for dynamic character translation.
 */
export const translateCaption = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { postId, caption, sourceLang, targetLang } = req.body as TranslateReq;

  const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const cloudflareAiToken = process.env.CLOUDFLARE_AI_TOKEN;

  try {
    const serviceResult = await executeTranslateCaption({
      postId,
      caption,
      sourceLang,
      targetLang,
      cloudflareAccountId,
      cloudflareAiToken,
    });

    if (
      serviceResult.status === "INVALID_PARAMS" ||
      serviceResult.status === "INVALID_ID_FORMAT"
    ) {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: serviceResult.payload,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error(
      `Dynamic caption translation pipeline failure [${postId}]:`,
      error,
    );

    let errorTransBlock: TransInfo =
      MESSAGES_REGISTRY.POST.TRANSLATION_PIPELINE_FAILURE;

    if (error.message === "MISSING_ENV") {
      errorTransBlock = MESSAGES_REGISTRY.POST.TRANSLATION_MISSING_ENV;
    } else if (error.message?.startsWith("HTTP_ERROR:")) {
      const statusCode = error.message.split(":")[1];
      errorTransBlock = MESSAGES_REGISTRY.POST.TRANSLATION_HTTP_ERROR(
        statusCode || "500",
      );
    } else if (error.message?.startsWith("API_ERROR:")) {
      const apiMessage = error.message.split(":")[1];
      errorTransBlock = MESSAGES_REGISTRY.POST.TRANSLATION_API_ERROR(
        apiMessage || "Unknown Error",
      );
    } else if (error.message === "MISSING_OUTPUT") {
      errorTransBlock = MESSAGES_REGISTRY.POST.TRANSLATION_MISSING_OUTPUT;
    }

    return forwardError(next, errorTransBlock, error);
  }
};
