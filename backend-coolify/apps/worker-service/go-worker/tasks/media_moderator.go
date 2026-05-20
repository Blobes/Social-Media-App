package tasks

import (
	"context"
	"errors"
	"fmt"
	"strings"

	vision "cloud.google.com/go/vision/v2/apiv1"
	"cloud.google.com/go/vision/v2/apiv1/visionpb"
	"github.com/sashabaranov/go-openai"
)

// Global static array mapping matching metrics straight from configuration definitions
var severityLevels = [3]Severity{SeverityCritical, SeverityModerate, SeverityLow}

/**
 * Assesses image safety by mapping safe search channels against weights.
 */
func validateMediaNative(ctx context.Context, visionClient *vision.ImageAnnotatorClient, openAIClient *openai.Client, imageUrl string, shouldExtractTopic bool) (ValidationResult, error) {

	var features []*visionpb.Feature
	features = append(features, &visionpb.Feature{Type: visionpb.Feature_SAFE_SEARCH_DETECTION})

	if shouldExtractTopic {
		features = append(features, &visionpb.Feature{Type: visionpb.Feature_LABEL_DETECTION})
	}

	req := &visionpb.AnnotateImageRequest{
		Image: &visionpb.Image{
			Source: &visionpb.ImageSource{ImageUri: imageUrl},
		},
		Features: features,
	}

	batchResp, err := visionClient.BatchAnnotateImages(ctx, &visionpb.BatchAnnotateImagesRequest{
		Requests: []*visionpb.AnnotateImageRequest{req},
	})
	if err != nil {
		return ValidationResult{}, err
	}

	if len(batchResp.Responses) == 0 {
		return ValidationResult{}, errors.New("empty response received from vision api")
	}

	result := batchResp.Responses[0]
	if result.Error != nil {
		return ValidationResult{}, errors.New(result.Error.Message)
	}

	var finalTopics []string
	if shouldExtractTopic && len(result.LabelAnnotations) > 0 {
		var labels []string
		for _, l := range result.LabelAnnotations {
			labels = append(labels, l.Description)
		}
		labelText := strings.Join(labels, ", ")

		textRefinement, err := validateTextNative(
			ctx,
			openAIClient,
			fmt.Sprintf("Visual labels from an image: %s", labelText),
			[]string{},
			"EXTRACTION_ONLY",
		)
		if err == nil {
			finalTopics = textRefinement.ExtractedTopics
		}
	}

	detections := result.SafeSearchAnnotation
	if detections != nil {
		for _, severityKey := range severityLevels {
			thresholdGroup := GlobalContentPolicy.Media.Thresholds[severityKey]

			for _, thresholdObj := range thresholdGroup {
				for category, thresholdLikelihood := range thresholdObj {
					var detectedLikelihood Likelihood

					switch category {
					case "adult":
						detectedLikelihood = Likelihood(detections.Adult.String())
					case "spoof":
						detectedLikelihood = Likelihood(detections.Spoof.String())
					case "medical":
						detectedLikelihood = Likelihood(detections.Medical.String())
					case "violence":
						detectedLikelihood = Likelihood(detections.Violence.String())
					case "racy":
						detectedLikelihood = Likelihood(detections.Racy.String())
					}

					weight := LikelihoodWeights[detectedLikelihood]
					thresholdWeight := LikelihoodWeights[thresholdLikelihood]

					if weight >= thresholdWeight {
						return ValidationResult{
							IsFlagged:       true,
							IsUnsure:        false,
							RuleViolated:    strings.ToUpper(category),
							Severity:        severityKey,
							Reason:          fmt.Sprintf("Media flagged for %s content with %s likelihood. (%s Policy)", strings.ToUpper(category), detectedLikelihood, severityKey),
							ExtractedTopics: []string{},
						}, nil
					}

					if weight > 0 && weight == thresholdWeight-1 {
						return ValidationResult{
							IsFlagged:       true,
							IsUnsure:        true,
							RuleViolated:    strings.ToUpper(category),
							Severity:        severityKey,
							Reason:          fmt.Sprintf("Potential %s content detected (%s). Review required.", strings.ToUpper(category), detectedLikelihood),
							ExtractedTopics: finalTopics,
						}, nil
					}
				}
			}
		}
	}

	return ValidationResult{
		IsFlagged:       false,
		IsUnsure:        false,
		RuleViolated:    "",
		Severity:        SeverityNone,
		Reason:          "",
		ExtractedTopics: finalTopics,
	}, nil
}
