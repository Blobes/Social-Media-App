import OpenAI from "openai";
import { CONTENT_POLICY } from "./policy";
import { IModerationRes, ISeverity } from "../../types/types";

let openai: OpenAI;

// Wait for OPENAI_API_KEY env variable
export const getOpenAIClient = (openaiKey: string) => {
  if (!openai) {
    openai = new OpenAI({ apiKey: openaiKey });
  }
  return openai;
};

export type ValidationMode = "EXTRACTION_ONLY" | "MODERATION_ONLY" | "BOTH";

export const validateText = async (
  openaiKey: string,
  text: string,
  providedTopics: string[],
  mode: ValidationMode = "BOTH",
): Promise<IModerationRes> => {
  const client = getOpenAIClient(openaiKey);
  // Use the new Severity-based structure
  const policyRules = CONTENT_POLICY.text;
  const needsExtraction =
    mode !== "MODERATION_ONLY" && providedTopics.length === 0;
  const needsModeration = mode !== "EXTRACTION_ONLY";

  const prompt = `
    Role: Senior Content Safety & Metadata Engine.
    TASK MODE: ${mode}

    ${
      needsModeration
        ? `
    POLICY HIERARCHY:
    - CRITICAL: Blocked + Account Flagged. Rules: ${JSON.stringify(policyRules[ISeverity.CRITICAL])}
    - MODERATE: Blocked + Requires Edit. Rules: ${JSON.stringify(policyRules[ISeverity.MODERATE])}
    - LOW: Allowed + Labeled/Hidden. Rules: ${JSON.stringify(policyRules[ISeverity.LOW])}
    `
        : ""
    }

    STRICT INSTRUCTIONS:
    1. VIOLATION CHECK: ${
      needsModeration
        ? `
       - Scrutinize "Content" against POLICY HIERARCHY.
       - Identify the specific rule violated and its Severity level.
       - If multiple violations occur, prioritize the highest Severity.`
        : "Skip. Set isFlagged false, ruleViolated null, severity null."
    }
    
    2. TOPIC LOGIC: ${needsExtraction ? "Analyze theme and extract exactly 2 relevant keywords." : "Return UserKeywords provided (capped at 2) or empty array."}
    
    RESPONSE FORMAT (JSON ONLY):
    {
      "isFlagged": boolean,
      "ruleViolated": "The specific policy string (e.g., 'Doxing') or null",
      "severity": "CRITICAL" | "MODERATE" | "LOW" | null,
      "reason": "Max 12-word explanation of violation or null",
      "confidence": number,
      "extractedKeywords": ["string", "string"]
    }

    UserKeywords: [${providedTopics.join(", ")}]
    Content: "${text}"
  `;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Professional content moderator. JSON output only. Strictly follow the POLICY HIERARCHY and TASK MODE.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Logic for "Unsure" based on your threshold
    const isUnsure =
      result.isFlagged &&
      result.confidence < CONTENT_POLICY.text.thresholds.aiConfidence;

    return {
      isFlagged: result.isFlagged || false,
      isUnsure,
      ruleViolated: result.ruleViolated || null,
      severity: (result.severity as ISeverity) || null,
      reason: result.reason || null,
      extractedTopics: result.extractedKeywords || [],
    };
  } catch (error: any) {
    console.error("OpenAI Service Error:", error.message);
    throw error;
  }
};
