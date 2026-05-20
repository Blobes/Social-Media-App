package tasks

type PostModerationPayload struct {
	PostID         string       `json:"postId"`
	PostType       string       `json:"postType"`
	UserID         string       `json:"userId"`
	Caption        string       `json:"caption"`
	Media          []MediaInput `json:"media"`
	Topics         []string     `json:"topics,omitempty"`
	SkipModeration bool         `json:"skipModeration,omitempty"`
	Event          string       `json:"event"`
}

type MediaInput struct {
	URL string `json:"url"`
}

type ModerationReport struct {
	Status       string   `json:"status"`
	Severity     Severity `json:"severity"`
	RuleViolated string   `json:"ruleViolated"`
	Topics       []string `json:"topics"`
	Reason       string   `json:"reason,omitempty"`
	NeedsReview  bool     `json:"needsReview"`
}

type NodeCallbackPayload struct {
	PostID    string           `json:"postId"`
	PostType  string           `json:"postType"`
	UserID    string           `json:"userId"`
	Caption   string           `json:"caption"`
	Media     []MediaInput     `json:"media"`
	ModResult ModerationReport `json:"modResult"`
	Event     string           `json:"event"`
}

type ValidationResult struct {
	IsFlagged       bool
	IsUnsure        bool
	RuleViolated    string
	Severity        Severity
	Reason          string
	ExtractedTopics []string
}

type OpenAIResponseFormat struct {
	IsFlagged         bool     `json:"isFlagged"`
	RuleViolated      string   `json:"ruleViolated"`
	Severity          string   `json:"severity"`
	Reason            string   `json:"reason"`
	Confidence        float64  `json:"confidence"`
	ExtractedKeywords []string `json:"extractedKeywords"`
}
