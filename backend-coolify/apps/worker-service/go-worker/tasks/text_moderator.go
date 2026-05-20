package tasks

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/sashabaranov/go-openai"
)

/**
 * Validates natural language fields against policy rules and models responses via OpenAI.
 */
func validateTextNative(ctx context.Context, client *openai.Client, text string, providedTopics []string, mode string) (ValidationResult, error) {
	criticalJSON, _ := json.Marshal(GlobalContentPolicy.Text.Rules[SeverityCritical])
	moderateJSON, _ := json.Marshal(GlobalContentPolicy.Text.Rules[SeverityModerate])
	lowJSON, _ := json.Marshal(GlobalContentPolicy.Text.Rules[SeverityLow])

	needsModeration := mode != "EXTRACTION_ONLY"
	needsExtraction := mode != "MODERATION_ONLY" && len(providedTopics) == 0

	var policyHierarchy string
	if needsModeration {
		policyHierarchy = fmt.Sprintf(`
    POLICY HIERARCHY:
    - CRITICAL: Blocked + Account Flagged. Rules: %s
    - MODERATE: Blocked + Requires Edit. Rules: %s
    - LOW: Allowed + Labeled/Hidden. Rules: %s`, criticalJSON, moderateJSON, lowJSON)
	}

	var violationCheck string
	if needsModeration {
		violationCheck = `- Scrutinize "Content" against POLICY HIERARCHY.
        - Identify the specific rule violated and its Severity level.
        - If multiple violations occur, prioritize the highest Severity.`
	} else {
		violationCheck = "Skip. Set isFlagged false, ruleViolated null, severity null."
	}

	var topicLogic string
	if needsExtraction {
		topicLogic = "Analyze theme and extract exactly 2 relevant keywords."
	} else {
		topicLogic = "Return UserKeywords provided (capped at 2) or empty array."
	}

	prompt := fmt.Sprintf(`
    Role: Senior Content Safety & Metadata Engine.
    TASK MODE: %s
    %s

    STRICT INSTRUCTIONS:
    1. VIOLATION CHECK: 
       %s
    
    2. TOPIC LOGIC: %s
    
    RESPONSE FORMAT (JSON ONLY):
    {
      "isFlagged": boolean,
      "ruleViolated": "The specific policy string (e.g., 'Doxing') or null",
      "severity": "CRITICAL" | "MODERATE" | "LOW" | null,
      "reason": "Max 12-word explanation of violation or null",
      "confidence": number,
      "extractedKeywords": ["string", "string"]
    }

    UserKeywords: [%s]
    Content: "%s"`, mode, policyHierarchy, violationCheck, topicLogic, strings.Join(providedTopics, ", "), text)

	resp, err := client.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model: openai.GPT4oMini,
			ResponseFormat: &openai.ChatCompletionResponseFormat{
				Type: openai.ChatCompletionResponseFormatTypeJSONObject,
			},
			Temperature: 0,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "Professional content moderator. JSON output only. Strictly follow the POLICY HIERARCHY and TASK MODE.",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
		},
	)

	if err != nil {
		return ValidationResult{}, err
	}

	var parsed OpenAIResponseFormat
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &parsed); err != nil {
		return ValidationResult{}, err
	}

	isUnsure := parsed.IsFlagged && parsed.Confidence < GlobalContentPolicy.Text.AIConfidenceLimit

	return ValidationResult{
		IsFlagged:       parsed.IsFlagged,
		IsUnsure:        isUnsure,
		RuleViolated:    parsed.RuleViolated,
		Severity:        Severity(parsed.Severity),
		Reason:          parsed.Reason,
		ExtractedTopics: parsed.ExtractedKeywords,
	}, nil
}
