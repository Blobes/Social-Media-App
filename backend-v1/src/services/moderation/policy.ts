export type Likelihood =
  | "UNKNOWN"
  | "VERY_UNLIKELY"
  | "UNLIKELY"
  | "POSSIBLE"
  | "LIKELY"
  | "VERY_LIKELY";

export enum Severity {
  CRITICAL = "CRITICAL", // Blocked + Account Flagged (Hard Block)
  MODERATE = "MODERATE", // Blocked + Requires Edit (Soft Block)
  LOW = "LOW", // Allowed + Labeled/Hidden (Soft Label)
}

export const CONTENT_POLICY = {
  version: "2026.1",

  text: {
    [Severity.CRITICAL]: [
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
    [Severity.MODERATE]: [
      "Hate speech (race, religion, gender, etc.)",
      "Targeted harassment",
      "Bullying",
      "Slurs",
      "Medical misinformation",
      "Election interference",
      "Harassment",
      "Harmful Misinformation",
    ],
    [Severity.LOW]: [
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
      [Severity.CRITICAL]: [
        { adult: "POSSIBLE" as Likelihood },
        { violence: "LIKELY" as Likelihood },
      ],
      [Severity.MODERATE]: [{ medical: "POSSIBLE" as Likelihood }],
      [Severity.LOW]: [
        { racy: "VERY_LIKELY" as Likelihood },
        { spoof: "VERY_LIKELY" as Likelihood },
      ],
    },
  },
};
