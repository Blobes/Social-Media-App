package tasks

import (
	"context"
	"strings"
	"sync"
)

/**
 * Manages concurrent execution across multi-modal assets using WaitGroups
 * and evaluates severity trees to compile the final moderation report.
 */
func (deps *DependencyContext) executeNativeSafetyPipeline(ctx context.Context, payload *PostModerationPayload) (ModerationReport, error) {
	captionText := strings.TrimSpace(payload.Caption)
	hasText := len(captionText) > 0
	hasUserTopics := len(payload.Topics) > 0

	var mediaToValidate []MediaInput
	if len(payload.Media) > 0 {
		if len(payload.Media) > 2 {
			mediaToValidate = payload.Media[:2]
		} else {
			mediaToValidate = payload.Media
		}
	}

	totalRoutines := 0
	if hasText {
		totalRoutines++
	}
	totalRoutines += len(mediaToValidate)

	if totalRoutines == 0 {
		return ModerationReport{
			Status:       "PUBLISHED",
			Severity:     SeverityNone,
			RuleViolated: "",
			Topics:       []string{},
			NeedsReview:  false,
		}, nil
	}

	var wg sync.WaitGroup
	resultsChan := make(chan ValidationResult, totalRoutines)
	errChan := make(chan error, totalRoutines)

	if hasText {
		wg.Add(1)
		go func(text string) {
			defer wg.Done()
			res, err := validateTextNative(ctx, deps.OpenAIClient, text, payload.Topics, "BOTH")
			if err != nil {
				errChan <- err
				return
			}
			resultsChan <- res
		}(captionText)
	}

	for i := range mediaToValidate {
		wg.Add(1)
		shouldExtract := !hasText && !hasUserTopics && i == 0
		go func(url string, extract bool) {
			defer wg.Done()
			res, err := validateMediaNative(ctx, deps.VisionClient, deps.OpenAIClient, url, extract)
			if err != nil {
				errChan <- err
				return
			}
			resultsChan <- res
		}(mediaToValidate[i].URL, shouldExtract)
	}

	wg.Wait()
	close(resultsChan)
	close(errChan)

	if len(errChan) > 0 {
		return ModerationReport{}, <-errChan
	}

	allResults := make([]ValidationResult, 0, totalRoutines)
	for res := range resultsChan {
		allResults = append(allResults, res)
	}

	var violation *ValidationResult
	var textResult *ValidationResult
	var mediaResults []ValidationResult

	for i := range allResults {
		if hasText && textResult == nil && !strings.Contains(allResults[i].Reason, "Media flagged") {
			textResult = &allResults[i]
		} else {
			mediaResults = append(mediaResults, allResults[i])
		}

		if allResults[i].IsFlagged && violation == nil {
			violation = &allResults[i]
		}
	}

	if violation != nil {
		if violation.IsUnsure {
			finalTopics := payload.Topics
			if len(violation.ExtractedTopics) > 0 {
				finalTopics = violation.ExtractedTopics
			}
			return ModerationReport{
				Status:       "UNDER_REVIEW",
				Severity:     violation.Severity,
				RuleViolated: violation.RuleViolated,
				Topics:       finalTopics,
				NeedsReview:  violation.Severity != SeverityLow,
				Reason:       violation.Reason,
			}, nil
		}

		switch violation.Severity {
		case SeverityCritical:
			return ModerationReport{
				Status:       "BANNED",
				Severity:     SeverityCritical,
				RuleViolated: violation.RuleViolated,
				Reason:       violation.Reason,
			}, nil
		case SeverityModerate:
			return ModerationReport{
				Status:       "UNDER_REVIEW",
				Severity:     SeverityModerate,
				RuleViolated: violation.RuleViolated,
				Reason:       violation.Reason,
			}, nil
		case SeverityLow:
			finalTopics := payload.Topics
			if len(violation.ExtractedTopics) > 0 {
				finalTopics = violation.ExtractedTopics
			}
			return ModerationReport{
				Status:       "SHADOWBANNED",
				Severity:     SeverityLow,
				RuleViolated: violation.RuleViolated,
				Topics:       finalTopics,
				NeedsReview:  false,
				Reason:       violation.Reason,
			}, nil
		}
	}

	finalTopics := []string{}
	if hasUserTopics {
		finalTopics = payload.Topics
	} else if textResult != nil && len(textResult.ExtractedTopics) > 0 {
		if len(textResult.ExtractedTopics) > 2 {
			finalTopics = textResult.ExtractedTopics[:2]
		} else {
			finalTopics = textResult.ExtractedTopics
		}
	} else if len(mediaResults) > 0 && len(mediaResults[0].ExtractedTopics) > 0 {
		if len(mediaResults[0].ExtractedTopics) > 2 {
			finalTopics = mediaResults[0].ExtractedTopics[:2]
		} else {
			finalTopics = mediaResults[0].ExtractedTopics
		}
	}

	return ModerationReport{
		Status:       "PUBLISHED",
		Topics:       finalTopics,
		NeedsReview:  false,
		Severity:     SeverityNone,
		RuleViolated: "",
	}, nil
}
