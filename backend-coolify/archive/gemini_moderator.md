package tasks

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type Moderator struct {
	client     *genai.Client
	modelName  string
	apiKey     string
	systemText string
	cacheLock  sync.RWMutex
	cachedName string
	cachedTTL  time.Duration
}

/* Returns the unified structural validation JSON schema layout. */
func getModerationSchema() *genai.Schema {
	return &genai.Schema{
		Type: genai.TypeObject,
		Properties: map[string]*genai.Schema{
			"isFlagged":         {Type: genai.TypeBoolean},
			"ruleViolated":      {Type: genai.TypeString},
			"severity":          {Type: genai.TypeString, Enum: []string{"CRITICAL", "MODERATE", "LOW", "NONE"}},
			"violationSource":   {Type: genai.TypeString, Enum: []string{"TEXT", "MEDIA", "NONE"}},
			"reason":            {Type: genai.TypeString},
			"confidence":        {Type: genai.TypeNumber},
			"extractedKeywords": {Type: genai.TypeArray, Items: &genai.Schema{Type: genai.TypeString}},
		},
		Required: []string{"isFlagged", "reason", "ruleViolated", "severity", "violationSource", "confidence", "extractedKeywords"},
	}
}

/* Initializes a new instance of the Gemini moderation processor. */
func NewGeminiModerator(ctx context.Context, apiKey string) (*Moderator, error) {
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("failed initializing gemini client: %w", err)
	}

	textCriticalJSON, _ := json.Marshal(GlobalContentPolicy.Text.Rules[SeverityCritical])
	textModerateJSON, _ := json.Marshal(GlobalContentPolicy.Text.Rules[SeverityModerate])
	textLowJSON, _ := json.Marshal(GlobalContentPolicy.Text.Rules[SeverityLow])

	mediaCriticalJSON, _ := json.Marshal(GlobalContentPolicy.Media.Rules[SeverityCritical])
	mediaModerateJSON, _ := json.Marshal(GlobalContentPolicy.Media.Rules[SeverityModerate])
	mediaLowJSON, _ := json.Marshal(GlobalContentPolicy.Media.Rules[SeverityLow])

	systemInstructionText := fmt.Sprintf(`
		Role: Senior Content Safety & Taxonomy Discovery Engine.

		OUTPUT FORMAT RULES:
		- You must output exactly and ONLY a valid JSON object matching the requested schema.
		- Do NOT include conversational text prefixes or suffixes.
		- Start your output immediately with the left brace character '{' and terminate exactly with the right brace character '}'.

		CORE OPERATION MODES (Look at the "Mode:" variable passed in the prompt):
		1. EXTRACT_KEYWORDS_ONLY: You must completely bypass safety policy evaluation. Do NOT look for rules violations. Set isFlagged to false, severity to "NONE", ruleViolated to "", and violationSource to "NONE". Your sole job is to process the fields to populate extractedKeywords.
		2. THUMBNAIL_PRE_SCREEN: Evaluate incoming media assets strictly against CRITICAL MEDIA RULES. Bypass MODERATE and LOW rules entirely for this mode.
		3. FULL_ASSESSMENT / MODERATE_ONLY / MODERATE_AND_EXTRACT_KEYWORDS: Perform full double-track enforcement evaluations.

		CORE EVALUATION PRINCIPLES:
		- TEXT EVALUATION (INTENT & CONTEXT-FOCUSED): Evaluate the holistic meaning, tone, and contextual intent of text strings. Do NOT perform simple keyword matching. Benign discussion or meta-commentary about safety systems must NOT be flagged.
		- MEDIA EVALUATION (STRICT RULE-BASED): Evaluate visual media content strictly based on explicit objects, actions, and depictions. If the media contains graphic elements matching the rules, flag it immediately regardless of intent.

		TEXT COMPLIANCE POLICY HIERARCHY:
		- CRITICAL TEXT RULES: %s
		- MODERATE TEXT RULES: %s
		- LOW TEXT RULES: %s

		VISUAL MEDIA COMPLIANCE POLICY HIERARCHY:
		- CRITICAL MEDIA RULES: %s
		- MODERATE MEDIA RULES: %s
		- LOW MEDIA RULES: %s

		TAXONOMY EXTRACTION RULES (extractedKeywords):
		- If the operational mode requests keyword extraction (EXTRACT_KEYWORDS_ONLY or MODERATE_AND_EXTRACT_KEYWORDS), extract exactly 2 relevant thematic topics or categories from the post payload content into extractedKeywords.
		- If the mode is MODERATE_ONLY, do NOT extract new topics; leave the extractedKeywords array completely empty.

		EVALUATION FLOWCHART:
		1. Parse the operational mode from the prompt parameter. If mode is "EXTRACT_KEYWORDS_ONLY", jump directly to extracting 2 keywords and return.
		2. Execute dual-track evaluation on the payload inputs based on the rules hierarchy specified above.
		3. Determine if any component contains a substantive policy violation:
		   - If NO: Set isFlagged to false, severity to "NONE", ruleViolated to "", violationSource to "NONE", and explain why it is safe in reason.
		   - If YES: Set isFlagged to true, select the highest applicable severity matching the violation, map the exact ruleViolated label, and set violationSource to "TEXT" or "MEDIA".
		`,
		textCriticalJSON, textModerateJSON, textLowJSON,
		mediaCriticalJSON, mediaModerateJSON, mediaLowJSON,
	)

	return &Moderator{
		client:     client,
		modelName:  "gemini-3.5-flash",
		apiKey:     apiKey,
		systemText: systemInstructionText,
		cachedTTL:  time.Hour * 3,
	}, nil
}

/* Closes the underlying connection pools gracefully. */
func (gm *Moderator) Close() {
	if gm.client != nil {
		gm.client.Close()
	}
}

/* Ensures a valid context cache is available for large token requests, recycling or creating keys dynamically. */
func (gm *Moderator) getOrCreateCache(ctx context.Context) (string, error) {
	gm.cacheLock.RLock()
	if gm.cachedName != "" {
		name := gm.cachedName
		gm.cacheLock.RUnlock()
		return name, nil
	}
	gm.cacheLock.RUnlock()

	gm.cacheLock.Lock()
	defer gm.cacheLock.Unlock()

	if gm.cachedName != "" {
		return gm.cachedName, nil
	}

	cachedContent, err := gm.client.CreateCachedContent(ctx, &genai.CachedContent{
		Model:      gm.modelName,
		Expiration: genai.ExpireTimeOrTTL{TTL: gm.cachedTTL},
		Contents: []*genai.Content{
			{
				Role: "user",
				Parts: []genai.Part{
					genai.Text(gm.systemText),
				},
			},
		},
	})
	if err != nil {
		return "", err
	}

	gm.cachedName = cachedContent.Name
	return gm.cachedName, nil
}

/* Evaluates full post content packages using a single, cost-optimized multimodal pass. */
func (gm *Moderator) GeminiModerator(ctx context.Context, payload *PostModData, mediaTarget []MediaInput, mode string) (ValidationResult, error) {
	model := gm.client.GenerativeModel(gm.modelName)

	maxTokens := int32(1000)
	temp := float32(0.0)

	model.GenerationConfig = genai.GenerationConfig{
		ResponseMIMEType: "application/json",
		ResponseSchema:   getModerationSchema(),
		MaxOutputTokens:  &maxTokens,
		Temperature:      &temp,
	}

	hasMedia := len(mediaTarget) > 0

	respTokens, err := model.CountTokens(ctx, genai.Text(gm.systemText))
	if err != nil {
		return ValidationResult{}, fmt.Errorf("token counter initialization failure: %w", err)
	}

	if hasMedia || respTokens.TotalTokens >= 1024 {
		cacheName, err := gm.getOrCreateCache(ctx)
		if err != nil {
			return ValidationResult{}, fmt.Errorf("failed to manage token context cache layer: %w", err)
		}
		model.CachedContentName = cacheName
	} else {
		model.SystemInstruction = &genai.Content{
			Parts: []genai.Part{genai.Text(gm.systemText)},
		}
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

	part, ok := resp.Candidates[0].Content.Parts[0].(genai.Text)
	if !ok {
		return ValidationResult{}, fmt.Errorf("unexpected part type received from model response asset")
	}

	rawText := strings.TrimSpace(string(part))

	startIndex := strings.Index(rawText, "{")
	endIndex := strings.LastIndex(rawText, "}")

	if startIndex != -1 && endIndex != -1 && endIndex > startIndex {
		rawText = rawText[startIndex : endIndex+1]
	} else {
		return ValidationResult{}, fmt.Errorf("gemini model failed to return a valid JSON object structure, received: %s", rawText)
	}

	var parsed AiResponseFormat
	if err := json.Unmarshal([]byte(rawText), &parsed); err != nil {
		return ValidationResult{}, fmt.Errorf("failed parsing target response JSON payload: %w", err)
	}

	finalSeverity := parsed.Severity
	if finalSeverity == "" || finalSeverity == "NONE" {
		finalSeverity = string(SeverityNone)
	}

	finalSource := parsed.ViolationSource
	if finalSource == "" {
		finalSource = "NONE"
	}

	isUnsure := parsed.IsFlagged && parsed.Confidence < GlobalContentPolicy.Text.AIConfidenceLimit
	hasSensitiveGraphic := parsed.IsFlagged && Severity(finalSeverity) == SeverityLow && finalSource == "MEDIA"

	return ValidationResult{
		IsFlagged:           parsed.IsFlagged,
		HasSensitiveGraphic: hasSensitiveGraphic,
		IsUnsure:            isUnsure,
		RuleViolated:        parsed.RuleViolated,
		Severity:            Severity(finalSeverity),
		ViolationSource:     finalSource,
		Reason:              parsed.Reason,
		ExtractedTopics:     parsed.ExtractedKeywords,
	}, nil
}
