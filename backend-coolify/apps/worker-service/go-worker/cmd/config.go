package main

import (
	"context"
	"log"
	"os"
	"strings"

	"go-worker/tasks"

	vision "cloud.google.com/go/vision/v2/apiv1"
	"github.com/hibiken/asynq"
	"github.com/joho/godotenv"
	"github.com/sashabaranov/go-openai"
	"google.golang.org/api/option"
	"google.golang.org/api/transport"
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

	var visionClient *vision.ImageAnnotatorClient
	var errVision error

	rawJSONKey := os.Getenv("GOOGLE_CREDENTIALS_JSON")

	// Create a slice to house verified, specific client option parameters safely
	var clientOptsList []option.ClientOption

	if rawJSONKey != "" && strings.HasPrefix(strings.TrimSpace(rawJSONKey), "{") {
		// Leverage transport connection parameters directly to generate credential-type-specific option functions cleanly
		creds, errCreds := transport.Creds(ctx, option.WithCredentialsJSON([]byte(rawJSONKey)))
		if errCreds != nil {
			log.Printf("❌ Failed to parse memory credential configurations securely: %v", errCreds)
			return nil, errCreds
		}
		// Bind the validated configuration to your options slice context
		clientOptsList = append(clientOptsList, option.WithCredentials(creds))
	} else if rawJSONKey != "" {
		// Explicit path pointer execution setup for local verification routines
		clientOptsList = append(clientOptsList, option.WithCredentialsFile(rawJSONKey))
	}

	// Initialize the structural image client using the safe option definitions populated above
	visionClient, errVision = vision.NewImageAnnotatorClient(ctx, clientOptsList...)
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
