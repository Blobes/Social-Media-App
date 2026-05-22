package tasks

type Severity string
type Likelihood string

const (
	SeverityCritical Severity = "CRITICAL"
	SeverityModerate Severity = "MODERATE"
	SeverityLow      Severity = "LOW"
	SeverityNone     Severity = "NONE"
)

const (
	LikelihoodUnknown      Likelihood = "UNKNOWN"
	LikelihoodVeryUnlikely Likelihood = "VERY_UNLIKELY"
	LikelihoodUnlikely     Likelihood = "UNLIKELY"
	LikelihoodPossible     Likelihood = "POSSIBLE"
	LikelihoodLikely       Likelihood = "LIKELY"
	LikelihoodVeryLikely   Likelihood = "VERY_LIKELY"
)

var LikelihoodWeights = map[Likelihood]int{
	LikelihoodUnknown:      0,
	LikelihoodVeryUnlikely: 1,
	LikelihoodUnlikely:     2,
	LikelihoodPossible:     3,
	LikelihoodLikely:       4,
	LikelihoodVeryLikely:   5,
}

/**
 * Initializes the unified severity-based safety rules.
 */
var GlobalContentPolicy = ContentPolicy{
	Version: "2026.1",
	Text: TextPolicy{
		AIConfidenceLimit: 0.85,
		Rules: map[Severity][]string{
			SeverityCritical: {
				"Child safety risks",
				"Self-harm encouragement",
				"Graphic violence description",
				"Sexual solicitation",
				"Illegal drug/weapon sales",
				"PII (Phone, Home Address, SSN)",
				"Illegal Acts",
				"Severe Violence",
				"Doxing",
			},
			SeverityModerate: {
				"Hate speech (race, religion, gender, etc.)",
				"Targeted harassment",
				"Bullying",
				"Slurs",
				"Medical misinformation",
				"Election interference",
				"Harassment",
				"Harmful Misinformation",
			},
			SeverityLow: {
				"Spam/Scams",
				"Deepfake claims without disclosure",
				"Profanity",
				"Clickbait",
				"Sensitive Language",
			},
		},
	},
	Media: MediaPolicy{
		Thresholds: map[Severity][]MediaThreshold{
			SeverityCritical: {
				{"adult": LikelihoodPossible},
				{"violence": LikelihoodLikely},
			},
			SeverityModerate: {
				{"medical": LikelihoodPossible},
			},
			SeverityLow: {
				{"racy": LikelihoodVeryLikely},
				{"spoof": LikelihoodVeryLikely},
			},
		},
	},
}
