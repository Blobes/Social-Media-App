package tasks

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type GeminiModerator struct {
	client    *genai.Client
	cacheName string
}

/**
 * Initializes a new instance of the Gemini moderation processor with context caching support.
 */
func NewGeminiModerator(ctx context.Context, apiKey string) (*GeminiModerator, error) {
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("failed initializing gemini client: %w", err)
	}

	criticalJSON, _ := json.Marshal(GlobalContentPolicy.Text.Rules[SeverityCritical])
	moderateJSON, _ := json.Marshal(GlobalContentPolicy.Text.Rules[SeverityModerate])
	lowJSON, _ := json.Marshal(GlobalContentPolicy.Text.Rules[SeverityLow])

	systemInstructionText := fmt.Sprintf(`
	Role: Senior Content Safety Engine.
	POLICY HIERARCHY:
	- CRITICAL: Rules: %s
	- MODERATE: Rules: %s
	- LOW: Rules: %s

	TASK:
	1. Check Content/Media against policy hierarchy. Choose the highest severity violation string if flagged.
	2. If mode is "THUMBNAIL_PRE_SCREEN", prioritize flagging strictly for CRITICAL rules.
	3. Extract exactly 2 relevant thematic topics into extractedKeywords if not empty.
	`, criticalJSON, moderateJSON, lowJSON)

	// Context caching initialization pattern
	cacheExpiryConfig := genai.ExpireTimeOrTTL{
		TTL: time.Hour * 3,
	}
	cachedContent, err := client.CreateCachedContent(ctx, &genai.CachedContent{
		Model:      "gemini-2.5-flash-lite",
		Expiration: cacheExpiryConfig,
		Contents: []*genai.Content{
			{
				Role: "user",
				Parts: []genai.Part{
					genai.Text(systemInstructionText),
				},
			},
		},
	})
	if err != nil {
		client.Close()
		return nil, fmt.Errorf("failed creating context cache matching framework guidelines: %w", err)
	}

	return &GeminiModerator{
		client:    client,
		cacheName: cachedContent.Name,
	}, nil
}

/**
 * Closes the underlying connection pools gracefully.
 */
func (gm *GeminiModerator) Close() {
	if gm.client != nil {
		gm.client.Close()
	}
}

/**
 * Evaluates full post content packages using a single, cost-optimized multimodal pass.
 */
func (gm *GeminiModerator) EvaluatePost(ctx context.Context, payload *PostModerationPayload, mediaTarget []MediaInput, mode string) (ValidationResult, error) {
	model := gm.client.GenerativeModel("gemini-2.5-flash-lite")

	maxTokens := int32(150)
	temp := float32(0.0)

	model.ResponseMIMEType = "application/json"
	model.MaxOutputTokens = &maxTokens
	model.Temperature = &temp
	model.CachedContentName = gm.cacheName

	model.ResponseSchema = &genai.Schema{
		Type: genai.TypeObject,
		Properties: map[string]*genai.Schema{
			"isFlagged":         {Type: genai.TypeBoolean},
			"ruleViolated":      {Type: genai.TypeString},
			"severity":          {Type: genai.TypeString, Enum: []string{"CRITICAL", "MODERATE", "LOW", ""}},
			"reason":            {Type: genai.TypeString},
			"confidence":        {Type: genai.TypeNumber},
			"extractedKeywords": {Type: genai.TypeArray, Items: &genai.Schema{Type: genai.TypeString}},
		},
		Required: []string{"isFlagged", "ruleViolated", "severity", "reason"},
	}

	var promptParts []genai.Part
	promptParts = append(promptParts, genai.Text(fmt.Sprintf("Mode: %s", mode)))

	if payload.Caption != "" {
		promptParts = append(promptParts, genai.Text(fmt.Sprintf("Caption: %s", payload.Caption)))
	}

	if len(payload.Topics) > 0 {
		promptParts = append(promptParts, genai.Text(fmt.Sprintf("UserKeywords: %s", strings.Join(payload.Topics, ", "))))
	}

	for _, m := range mediaTarget {
		var targetURL string
		if m.Type == "VIDEO" && m.ThumbnailURL != nil && *m.ThumbnailURL != "" && mode == "THUMBNAIL_PRE_SCREEN" {
			targetURL = *m.ThumbnailURL
		} else {
			targetURL = m.URL
		}

		// Use FileData wrapper struct for external URI values
		promptParts = append(promptParts, genai.FileData{
			URI: targetURL,
		})
	}

	resp, err := model.GenerateContent(ctx, promptParts...)
	if err != nil {
		return ValidationResult{}, fmt.Errorf("gemini execution block failure: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return ValidationResult{}, fmt.Errorf("empty generation response from gemini engine")
	}

	var parsed GeminiResponseFormat
	jsonText := fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0])
	if err := json.Unmarshal([]byte(jsonText), &parsed); err != nil {
		return ValidationResult{}, fmt.Errorf("failed parsing target response JSON payload: %w", err)
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
