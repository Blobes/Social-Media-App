package tasks

/**
 * Initializes the unified severity-based safety rules.
 */
var GlobalContentPolicy = ContentPolicy{
	Version: "2026.4",
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
		Rules: map[Severity][]string{
			SeverityCritical: {
				"Underage individuals depicted in suggestive or dangerous situations",
				"Depictions of active weapons deployment, non-medical violence, terrorism, or active criminal operations",
			},
			SeverityModerate: {
				"Hate symbols, discriminatory imagery, or promotional extremist material",
				"Visual harassment, mocking individuals, or shaming assets",
				"Dangerous stunts or actions likely to lead to severe self-injury",
				"Altered/Manipulated media mimicking real events for disinformation",
			},
			SeverityLow: {
				"Explicit sexual acts, pornography, or display of genitalia (Adult Content)",
				"Graphic medical procedures, intense surgical gore, open wounds, or clinical operations (Medical Gory Content)",
				"Racy imagery, suggestive posing, or partial nudity without explicit acts",
				"Spam layouts, QR codes, or low-quality clickbait promotional banners",
			},
		},
	},
}
