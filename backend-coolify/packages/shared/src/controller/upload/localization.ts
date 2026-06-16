import { Response } from "express";
import { IAuthRequest, IS3Config } from "../../types";
import { createS3Service } from "../../services/s3";

/**
 * Accepts a pre-translated JSON language payload dictionary and uploads it to R2.
 */
export const LocalizationUpload = (s3Config: IS3Config) => {
  const s3Service = createS3Service(s3Config);

  return async (req: IAuthRequest, res: Response): Promise<void> => {
    const { namespace, lang, payload } = req.body as {
      namespace: string;
      lang: string;
      payload: Record<string, any>;
    };

    if (!namespace || !lang || !payload) {
      res
        .status(400)
        .json({
          status: "ERROR",
          message: "Missing required tracking upload options.",
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

      res
        .status(200)
        .json({
          status: "SUCCESS",
          message: "Localization block persisted successfully.",
        });
    } catch (error: any) {
      console.error("System localization R2 push failed:", error);
      res
        .status(500)
        .json({
          status: "ERROR",
          message: error.message || "Failed to persist translation sync maps.",
        });
    }
  };
};
