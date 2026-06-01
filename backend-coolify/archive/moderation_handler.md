package tasks

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/hibiken/asynq"
	"log"
)

/**
 * Ingests asymmetric post payloads, evaluates native content safety,
 * maps violation thresholds, and dispatches data states back to the database core.
 */
func (deps *DependencyContext) HandlePostModerationTask(ctx context.Context, t *asynq.Task) error {
	var payload PostModerationPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("contract ingestion failure: %w", err)
	}

	// Validate baseline presence rules safely before calling cloud services
	if payload.Caption == "" && len(payload.Media) == 0 {
		log.Printf("⚠️ Aborting task %s: caption and media channels cannot both be empty", payload.PostID)
		return nil
	}

	log.Printf("📥 Processing validation task for post: %s (Has Caption: %t, Media Count: %d)",
		payload.PostID, payload.Caption != "", len(payload.Media))

	var report ModerationReport

	if payload.SkipModeration {
		report = ModerationReport{
			Status:       "PUBLISHED",
			Topics:       payload.Topics,
			NeedsReview:  false,
			Severity:     SeverityNone,
			RuleViolated: "",
			Reason:       "User proceeded after acknowledgment",
		}
	} else {
		var err error
		// Pass down dependencies safely to the underlying moderation pipeline
		report, err = deps.executeNativeSafetyPipeline(ctx, &payload)
		if err != nil {
			log.Printf("Safety pipeline encountered operational faults: %v", err)
			report = ModerationReport{
				Status:       "UNDER_REVIEW",
				Topics:       payload.Topics,
				NeedsReview:  true,
				RuleViolated: "AI_ERROR",
				Reason:       err.Error(),
			}
		}
	}

	callbackBody := NodeCallbackPayload{
		PostID:    payload.PostID,
		PostType:  payload.PostType,
		UserID:    payload.UserID,
		Caption:   payload.Caption,
		Media:     payload.Media,
		Event:     payload.Event,
		ModResult: report,
	}

	// Dispatches the compiled moderation state directly through the clean client interface
	if err := deps.NodeClient.DispatchFinalization(ctx, "/finalize-post", &callbackBody); err != nil {
		return fmt.Errorf("state persistence phase across execution bridge failed: %w", err)
	}

	log.Printf("Successfully completed native Go moderation workflow for post: %s", payload.PostID)
	return nil
}
