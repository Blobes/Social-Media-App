import vision from "@google-cloud/vision";
import { CONTENT_POLICY, Likelihood, Severity } from "./policy";
import { validateText } from "./validateText";
import { ModerationResponse } from "@/utils/types/types";

const client = new vision.ImageAnnotatorClient();

const LIKELIHOOD_WEIGHTS: Record<Likelihood, number> = {
  UNKNOWN: 0,
  VERY_UNLIKELY: 1,
  UNLIKELY: 2,
  POSSIBLE: 3,
  LIKELY: 4,
  VERY_LIKELY: 5,
};

export const validateMedia = async (
  imageUrl: string,
  shouldExtractTopic: boolean = false,
): Promise<ModerationResponse> => {
  const features: any[] = [{ type: "SAFE_SEARCH_DETECTION" }];

  if (shouldExtractTopic) {
    features.push({ type: "LABEL_DETECTION" });
  }

  try {
    const [result] = await client.annotateImage({
      image: { source: { imageUri: imageUrl } },
      features,
    });

    const detections = result.safeSearchAnnotation;
    const labels = result.labelAnnotations || [];

    // 1. Safety Check against New Severity-Based Policy
    if (detections) {
      // Iterate through each severity level: CRITICAL, MODERATE, LOW
      for (const severityKey of Object.values(Severity)) {
        const thresholdGroup = CONTENT_POLICY.media.thresholds[severityKey];

        for (const thresholdObj of thresholdGroup) {
          // Get category (e.g., 'adult') and its required likelihood threshold
          const [category, thresholdLikelihood] =
            Object.entries(thresholdObj)[0];

          const detectedLikelihood = detections[
            category as keyof typeof detections
          ] as Likelihood;

          const weight = LIKELIHOOD_WEIGHTS[detectedLikelihood];
          const thresholdWeight =
            LIKELIHOOD_WEIGHTS[thresholdLikelihood as Likelihood];

          // Check for Violation
          if (weight >= thresholdWeight) {
            return {
              isUnsure: false, // AI/Vision is certain of the threshold breach
              ruleViolated: category.toUpperCase(),
              severity: severityKey, // Now passing back the Severity for middleware logic
              reason: `Media flagged for ${category.toUpperCase()} content with ${detectedLikelihood} likelihood. (${severityKey} Policy)`,
              extractedTopics: [],
            };
          }

          // Unsure/Near-miss logic: 1 level below threshold
          if (weight > 0 && weight === thresholdWeight - 1) {
            return {
              isUnsure: true,
              ruleViolated: category.toUpperCase(),
              severity: severityKey,
              reason: `Potential ${category.toUpperCase()} content detected (${detectedLikelihood}). Review required.`,
              extractedTopics: [],
            };
          }
        }
      }
    }

    // 2. Reuse validateText logic for Topic Extraction
    let finalTopics: string[] = [];

    if (shouldExtractTopic && labels.length > 0) {
      const labelString = labels.map((l: any) => l.description).join(", ");

      const textRefinement = await validateText(
        `Visual labels from an image: ${labelString}`,
        [],
        "EXTRACTION_ONLY",
      );

      finalTopics = textRefinement.extractedTopics;
    }

    return {
      isUnsure: false,
      ruleViolated: null,
      severity: null,
      reason: null,
      extractedTopics: finalTopics,
    };
  } catch (error) {
    console.error("Media Validation Error:", error);
    return {
      isUnsure: false,
      ruleViolated: null,
      severity: null,
      reason: null,
      extractedTopics: [],
    };
  }
};
