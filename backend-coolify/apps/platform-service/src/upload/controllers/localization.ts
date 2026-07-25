import { s3Config } from "@/envVars";
import {
  createS3Service,
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { Response, NextFunction } from "express";

interface UploadBody {
  namespace: string;
  lang: string;
  payload: Record<string, any>;
}

/**
 * Accepts a pre-translated JSON language payload dictionary and uploads it to R2.
 */
export const LocalizationUpload = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { namespace, lang, payload } = req.body as UploadBody;
  const s3Service = createS3Service(s3Config);

  if (!namespace || !lang || !payload) {
    res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.UPLOAD.LOCALIZATION_PARAMS_REQUIRED,
      payload: null,
    });
    return;
  }

  try {
    const storageKey = `locales/${lang}/${namespace}.json`;
    console.log(`Persisting localization file to R2: ${storageKey}`);

    // Store the raw JSON content payload securely inside Cloudflare R2
    await s3Service.uploadRawJsonToS3(
      storageKey,
      JSON.stringify(payload, null, 2),
    );

    res.status(200).json({
      status: "SUCCESS",
      ...MESSAGES_REGISTRY.UPLOAD.LOCALIZATION_PERSISTED_SUCCESSFULLY,
      payload: null,
    });
  } catch (error: any) {
    console.error("System localization R2 push failed:", error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.UPLOAD.LOCALIZATION_UPLOAD_THROWN_ERROR,
      error,
    );
  }
};
