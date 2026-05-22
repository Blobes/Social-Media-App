package tasks

type PostModerationPayload struct {
	PostID         string       `json:"postId"`
	PostType       string       `json:"postType"`
	UserID         string       `json:"userId"`
	Caption        string       `json:"caption,omitempty"`
	Media          []MediaInput `json:"media,omitempty"`
	Topics         []string     `json:"topics,omitempty"`
	SkipModeration bool         `json:"skipModeration,omitempty"`
	Event          string       `json:"event"`
}

type MediaDimensions struct {
	Width       float64 `json:"width"`
	Height      float64 `json:"height"`
	AspectRatio float64 `json:"aspectRatio"`
}

type MediaInput struct {
	URL             string           `json:"url"`
	FileKey         string           `json:"fileKey"`
	Type            string           `json:"type"`
	ThumbnailURL    *string          `json:"thumbnailUrl,omitempty"`
	MimeType        *string          `json:"mimeType,omitempty"`
	Size            *int64           `json:"size,omitempty"`
	Dimensions      *MediaDimensions `json:"dimensions,omitempty"`
	BlurHash        *string          `json:"blurHash,omitempty"`
	StorageProvider string           `json:"storageProvider"`
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
	WasSampled      bool // Indicates if the media payload underwent partitioning
}

type OpenAIResponseFormat struct {
	IsFlagged         bool     `json:"isFlagged"`
	RuleViolated      string   `json:"ruleViolated"`
	Severity          string   `json:"severity"`
	Reason            string   `json:"reason"`
	Confidence        float64  `json:"confidence"`
	ExtractedKeywords []string `json:"extractedKeywords"`
}

type GeminiResponseFormat struct {
	IsFlagged         bool     `json:"isFlagged"`
	RuleViolated      string   `json:"ruleViolated"`
	Severity          string   `json:"severity"`
	Reason            string   `json:"reason"`
	Confidence        float64  `json:"confidence"`
	ExtractedKeywords []string `json:"extractedKeywords"`
}

type MediaThreshold map[string]Likelihood

type TextPolicy struct {
	Rules             map[Severity][]string
	AIConfidenceLimit float64
}

type MediaPolicy struct {
	Thresholds map[Severity][]MediaThreshold
}

type ContentPolicy struct {
	Version string
	Text    TextPolicy
	Media   MediaPolicy
}

type DependencyContext struct {
	// VisionClient *vision.ImageAnnotatorClient
	// OpenAIClient *openai.Client
	GeminiAPIKey string
	NodeClient   *NodeClient
}
