package tasks

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/hibiken/asynq"
)

/* Worker node process to ingest payloads and run the optimized OpenRouter pipeline.
 */
func (deps *DependencyContext) HandlePostModeration(ctx context.Context, t *asynq.Task) error {
	var payload PostModData
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("contract ingestion failure: %w", err)
	}

	if payload.Caption == "" && len(payload.Media) == 0 {
		log.Printf("⚠️ Aborting task %s: caption and media channels cannot both be empty", payload.PostID)
		return nil
	}

	log.Printf("📥 Processing validation task for post: %s (Mode: %s, Media Count: %d)",
		payload.PostID, payload.ModerationTaskMode, len(payload.Media))

	var report ModerationReport
	var err error

	report, err = deps.ExecuteModerationPipeline(ctx, &payload)
	if err != nil {
		log.Printf("OpenRouter moderation pipeline encountered operational faults: %v", err)

		report = ModerationReport{
			Status:              StatusShadowbanned,
			ExtractedTopics:     payload.Topics,
			NeedsReview:         true,
			RuleViolated:        "AI_ERROR",
			Reason:              err.Error(),
			Severity:            SeverityUnknown,
			HasSensitiveGraphic: false,
		}
	}

	callbackBody := PostModCallbackPayload{
		BasePostMetadata: BasePostMetadata{
			PostID:   payload.PostID,
			PostType: payload.PostType,
			UserID:   payload.UserID,
			Caption:  payload.Caption,
			Media:    payload.Media,
		},
		Event:     payload.Event,
		ModResult: report,
	}

	log.Printf("📤 Dispatching finalization status (%s) over HTTP bridge to Node for post: %s", report.Status, payload.PostID)
	if err := deps.NodeClient.DispatchFinalization(ctx, "/finalize-post", &callbackBody); err != nil {
		return fmt.Errorf("state persistence phase across execution bridge failed: %w", err)
	}

	log.Printf("✅ Successfully completed OpenRouter layout moderation workflow for post: %s", payload.PostID)
	return nil
}
