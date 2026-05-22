package tasks

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/hibiken/asynq"
)

/**
 * Worker node process to ingest payloads and run the optimized Gemini pipeline.
 */
func (deps *DependencyContext) HandlePostModeration(ctx context.Context, t *asynq.Task) error {
	var payload PostModerationPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("contract ingestion failure: %w", err)
	}

	if payload.Caption == "" && len(payload.Media) == 0 {
		log.Printf("⚠️ Aborting task %s: caption and media channels cannot both be empty", payload.PostID)
		return nil
	}

	log.Printf("📥 Processing validation task for post: %s (Has Caption: %t, Media Count: %d)",
		payload.PostID, payload.Caption != "", len(payload.Media))

	var report ModerationReport
	var err error

	// Run the safety pipeline logic (internally checks for payload.SkipModeration)
	report, err = deps.executeGeminiSafetyPipeline(ctx, &payload)
	if err != nil {
		log.Printf("Gemini moderation pipeline encountered operational faults: %v", err)

		// Fallback configuration to prevent task hanging or un-notified states on structural failures
		report = ModerationReport{
			Status:       "UNDER_REVIEW",
			Topics:       payload.Topics,
			NeedsReview:  true,
			RuleViolated: "AI_ERROR",
			Reason:       err.Error(),
			Severity:     SeverityModerate,
		}
	}

	// Format callback layout wrapper matching Node server ingestion expectations
	callbackBody := NodeCallbackPayload{
		PostID:    payload.PostID,
		PostType:  payload.PostType,
		UserID:    payload.UserID,
		Caption:   payload.Caption,
		Media:     payload.Media,
		Event:     payload.Event,
		ModResult: report,
	}

	// Dispatch results across the bridge to finalize state mutation on the main database
	log.Printf("📤 Dispatching finalization status (%s) over HTTP bridge to Node for post: %s", report.Status, payload.PostID)
	if err := deps.NodeClient.DispatchFinalization(ctx, "/finalize-post", &callbackBody); err != nil {
		return fmt.Errorf("state persistence phase across execution bridge failed: %w", err)
	}

	log.Printf("✅ Successfully completed Gemini layout moderation workflow for post: %s", payload.PostID)
	return nil
}
