package main

import (
	"context"
	"log"
	"os"

	"go-worker/tasks"

	vision "cloud.google.com/go/vision/v2/apiv1"
	"github.com/hibiken/asynq"
	"github.com/joho/godotenv"
	"github.com/sashabaranov/go-openai"
	"google.golang.org/api/option"
)

type AppConfig struct {
	AsynqOpts    asynq.RedisClientOpt
	TaskDeps     *tasks.DependencyContext
	VisionClient *vision.ImageAnnotatorClient
}

/**
 * Loads environment configurations and initializes connection-pooled cloud SDK clients.
 */
func LoadEnvVars(ctx context.Context) (*AppConfig, error) {
	// Attempt loading your production environment profile layout natively
	if err := godotenv.Load("../../../.env.production"); err != nil {
		log.Println("ℹ️ No .env.production file found, processing system level context maps")
	}

	redisURL := os.Getenv("FUNSTAKES_REDIS_URL")
	if redisURL == "" {
		// Formatted connection URI string structure matching your internal infrastructure network routing
		redisURL = "redis://62.171.158.199:3100/0"
	}

	// Safely parse the connection metadata to handle port allocations and database indexes correctly
	parsedOpts, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		log.Printf("❌ Failed to parse raw connection sequence string: %v", err)
		return nil, err
	}

	// Cast the underlying core option model configurations
	clientOpts := parsedOpts.(asynq.RedisClientOpt)

	// Determine credential loading method based on runtime environment context
	var visionClient *vision.ImageAnnotatorClient
	var errVision error

	rawJSONKey := os.Getenv("GOOGLE_CREDENTIALS_JSON")
	if rawJSONKey != "" {
		// Initialize the client directly from memory using raw environment string data
		visionClient, errVision = vision.NewImageAnnotatorClient(ctx, option.WithCredentialsJSON([]byte(rawJSONKey)))
	} else {
		// Fall back to standard file path validation loops (useful for local development workflows)
		visionClient, errVision = vision.NewImageAnnotatorClient(ctx)
	}

	if errVision != nil {
		log.Printf("❌ Failed to initialize system-wide Google Vision SDK: %v", errVision)
		return nil, errVision
	}

	openAIKey := os.Getenv("OPENAI_API_KEY")
	if openAIKey == "" {
		openAIKey = "YOUR_OPENAI_API_KEY"
	}
	openaiClient := openai.NewClient(openAIKey)

	// Instantiate structural dependency contexts safely
	taskDeps := &tasks.DependencyContext{
		VisionClient: visionClient,
		OpenAIClient: openaiClient,
		NodeClient:   tasks.NewNodeClient("http://localhost:8083/internal/finalize-post"),
	}

	return &AppConfig{
		AsynqOpts:    clientOpts,
		TaskDeps:     taskDeps,
		VisionClient: visionClient,
	}, nil
}
