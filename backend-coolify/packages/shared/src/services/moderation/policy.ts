import { ILikelihood, ISeverity } from "../../types/types";

export const CONTENT_POLICY = {
  version: "2026.1",

  text: {
    [ISeverity.CRITICAL]: [
      "Child safety risks",
      "Self-harm encouragement",
      "Graphic violence description",
      "Sexual solicitation",
      "Illegal drug/weapon sales",
      "PII (Phone, Home Address, SSN)",
      "Illegal Acts",
      "Severe Violence",
      "Doxing",
    ],
    [ISeverity.MODERATE]: [
      "Hate speech (race, religion, gender, etc.)",
      "Targeted harassment",
      "Bullying",
      "Slurs",
      "Medical misinformation",
      "Election interference",
      "Harassment",
      "Harmful Misinformation",
    ],
    [ISeverity.LOW]: [
      "Spam/Scams",
      "Deepfake claims without disclosure",
      "Profanity",
      "Clickbait",
      "Sensitive Language",
    ],
    thresholds: {
      aiConfidence: 0.85,
    },
  },

  media: {
    thresholds: {
      [ISeverity.CRITICAL]: [
        { adult: "POSSIBLE" as ILikelihood },
        { violence: "LIKELY" as ILikelihood },
      ],
      [ISeverity.MODERATE]: [{ medical: "POSSIBLE" as ILikelihood }],
      [ISeverity.LOW]: [
        { racy: "VERY_LIKELY" as ILikelihood },
        { spoof: "VERY_LIKELY" as ILikelihood },
      ],
    },
  },
};
