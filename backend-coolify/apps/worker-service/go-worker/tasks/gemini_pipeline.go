package tasks

import (
	"context"
	"log"
)

/**
 * Orchestrates multi-stage fallback execution routines utilizing the struct-bound moderator client.
 */
func (deps *DependencyContext) executeGeminiSafetyPipeline(ctx context.Context, payload *PostModerationPayload) (ModerationReport, error) {
	// Intercept execution and return bypass status parameters early if flag evaluates to true
	if payload.SkipModeration {
		log.Printf("⏭️ Bypassing evaluation pipeline for post %s via explicit user verification acknowledgement", payload.PostID)
		return ModerationReport{
			Status:       "PUBLISHED",
			Topics:       payload.Topics,
			NeedsReview:  false,
			Severity:     SeverityNone,
			RuleViolated: "",
			Reason:       "User proceeded after acknowledgment",
		}, nil
	}

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

	if hasVideo {
		log.Printf("⏳ Pre-screening video thumbnails for critical policy violations on post: %s", payload.PostID)
		finalResult, err = moderator.EvaluatePost(ctx, payload, mediaToValidate, "THUMBNAIL_PRE_SCREEN")
		if err != nil {
			return ModerationReport{}, err
		}

		if finalResult.IsFlagged && finalResult.Severity == SeverityCritical {
			log.Printf("🛑 Video thumbnail pre-screen triggered Critical rejection for post: %s", payload.PostID)
			return ModerationReport{
				Status:       "BANNED",
				Severity:     SeverityCritical,
				RuleViolated: finalResult.RuleViolated,
				Reason:       "[Pre-Screen Reject] " + finalResult.Reason,
			}, nil
		}
	}

	log.Printf("🔍 Running full safety assessment for post: %s", payload.PostID)
	finalResult, err = moderator.EvaluatePost(ctx, payload, mediaToValidate, "FULL_ASSESSMENT")
	if err != nil {
		return ModerationReport{}, err
	}

	finalResult.WasSampled = wasSampled

	if finalResult.IsFlagged {
		if finalResult.IsUnsure {
			return ModerationReport{
				Status:       "UNDER_REVIEW",
				Severity:     finalResult.Severity,
				RuleViolated: finalResult.RuleViolated,
				Topics:       payload.Topics,
				NeedsReview:  finalResult.Severity != SeverityLow,
				Reason:       finalResult.Reason,
			}, nil
		}

		switch finalResult.Severity {
		case SeverityCritical:
			return ModerationReport{
				Status:       "BANNED",
				Severity:     SeverityCritical,
				RuleViolated: finalResult.RuleViolated,
				Reason:       finalResult.Reason,
			}, nil
		case SeverityModerate:
			return ModerationReport{
				Status:       "UNDER_REVIEW",
				Severity:     SeverityModerate,
				RuleViolated: finalResult.RuleViolated,
				Reason:       finalResult.Reason,
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
				Status:       "SHADOWBANNED",
				Severity:     SeverityLow,
				RuleViolated: finalResult.RuleViolated,
				Topics:       topics,
				NeedsReview:  false,
				Reason:       reasonText,
			}, nil
		}
	}

	topics := payload.Topics
	if len(topics) == 0 && len(finalResult.ExtractedTopics) > 0 {
		if len(finalResult.ExtractedTopics) > 2 {
			topics = finalResult.ExtractedTopics[:2]
		} else {
			topics = finalResult.ExtractedTopics
		}
	}

	return ModerationReport{
		Status:       "PUBLISHED",
		Topics:       topics,
		NeedsReview:  false,
		Severity:     SeverityNone,
		RuleViolated: "",
	}, nil
}
