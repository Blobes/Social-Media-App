package tasks

import (
	"context"
	"log"
)

/* Orchestrates multi-stage execution routines utilizing the struct-bound moderator client. */
func (deps *DependencyContext) GeminiExecuteModerationPipeline(ctx context.Context, payload *PostModData) (ModerationReport, error) {
	moderator, err := NewGeminiModerator(ctx, deps.GeminiAPIKey)
	if err != nil {
		return ModerationReport{}, err
	}
	defer moderator.Close()

	originalMediaCount := len(payload.Media)
	var mediaToValidate []MediaInput
	wasSampled := false

	if originalMediaCount > 6 {
		log.Printf("📊 High-volume media package detected (%d files). Partitioning into chunks...", originalMediaCount)
		mediaToValidate = sampleMediaGroups(payload.Media, 4, 3)
		wasSampled = true
		log.Printf("✂️ Sampling complete. Scaled asset collection length down from %d to %d items", originalMediaCount, len(mediaToValidate))
	} else {
		mediaToValidate = payload.Media
	}

	hasVideo := false
	for _, m := range mediaToValidate {
		if m.Type == "VIDEO" {
			hasVideo = true
			break
		}
	}

	var finalResult ValidationResult

	// Pre-screening execution block applies strictly to active moderation passes hosting visual elements
	if hasVideo && payload.ModerationTaskMode != ExtractedKeywordsOnly {
		log.Printf("⏳ Pre-screening video thumbnails for critical policy violations on post: %s", payload.PostID)
		finalResult, err = moderator.GeminiModerator(ctx, payload, mediaToValidate, "THUMBNAIL_PRE_SCREEN")
		if err != nil {
			return ModerationReport{}, err
		}

		if finalResult.IsFlagged && finalResult.Severity == SeverityCritical {
			log.Printf("🛑 Video thumbnail pre-screen triggered Critical rejection for post: %s", payload.PostID)
			return ModerationReport{
				Status:              StatusBanned,
				Severity:            SeverityCritical,
				RuleViolated:        finalResult.RuleViolated,
				Reason:              "[Pre-Screen Reject] " + finalResult.Reason,
				HasSensitiveGraphic: finalResult.HasSensitiveGraphic,
			}, nil
		}
	}

	log.Printf("🔍 Running target safety assessment mode [%s] for post: %s", payload.ModerationTaskMode, payload.PostID)
	finalResult, err = moderator.GeminiModerator(ctx, payload, mediaToValidate, string(payload.ModerationTaskMode))
	if err != nil {
		return ModerationReport{}, err
	}

	finalResult.WasSampled = wasSampled

	if finalResult.IsFlagged {
		if finalResult.IsUnsure {
			return ModerationReport{
				Status:              StatusUnderReview,
				Severity:            finalResult.Severity,
				RuleViolated:        finalResult.RuleViolated,
				ExtractedTopics:     payload.Topics,
				NeedsReview:         finalResult.Severity != SeverityLow,
				Reason:              finalResult.Reason,
				HasSensitiveGraphic: finalResult.HasSensitiveGraphic,
			}, nil
		}

		switch finalResult.Severity {
		case SeverityCritical:
			return ModerationReport{
				Status:              StatusBanned,
				Severity:            SeverityCritical,
				RuleViolated:        finalResult.RuleViolated,
				Reason:              finalResult.Reason,
				HasSensitiveGraphic: finalResult.HasSensitiveGraphic,
			}, nil

		case SeverityModerate:
			return ModerationReport{
				Status:              StatusUnderReview,
				Severity:            SeverityModerate,
				RuleViolated:        finalResult.RuleViolated,
				ExtractedTopics:     payload.Topics,
				NeedsReview:         true,
				Reason:              finalResult.Reason,
				HasSensitiveGraphic: finalResult.HasSensitiveGraphic,
			}, nil

		case SeverityLow:
			topics := payload.Topics
			if len(finalResult.ExtractedTopics) > 0 {
				topics = finalResult.ExtractedTopics
			}

			reasonText := finalResult.Reason
			if finalResult.WasSampled {
				reasonText = "[Sampled Content] " + reasonText
			}

			return ModerationReport{
				Status:              StatusShadowbanned,
				Severity:            SeverityLow,
				RuleViolated:        finalResult.RuleViolated,
				ExtractedTopics:     topics,
				NeedsReview:         false,
				Reason:              reasonText,
				HasSensitiveGraphic: finalResult.HasSensitiveGraphic,
			}, nil
		}
	}

	// Fallback assignment routes context parameters safely depending on explicit mode targets
	topics := payload.Topics
	if payload.ModerationTaskMode == ModerateAndExtractKeywords || payload.ModerationTaskMode == ExtractedKeywordsOnly {
		if len(topics) == 0 && len(finalResult.ExtractedTopics) > 0 {
			if len(finalResult.ExtractedTopics) > 2 {
				topics = finalResult.ExtractedTopics[:2]
			} else {
				topics = finalResult.ExtractedTopics
			}
		}
	}

	// Dynamic baseline assignment depending on taxonomy extraction configurations
	finalStatus := StatusPublished
	var operationalReason string
	if payload.ModerationTaskMode == ExtractedKeywordsOnly {
		operationalReason = "Taxonomy processing complete. Moderation skipped via pipeline directives."
	}

	return ModerationReport{
		Status:              finalStatus,
		ExtractedTopics:     topics,
		NeedsReview:         false,
		Severity:            SeverityNone,
		RuleViolated:        "",
		Reason:              operationalReason,
		HasSensitiveGraphic: finalResult.HasSensitiveGraphic,
	}, nil
}
