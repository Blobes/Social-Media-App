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
	if err := godotenv.Load("../../../.env.production"); err != nil {
		log.Println("ℹ️ No .env.production file found, processing system level context maps")
	}

	redisURL := os.Getenv("FUNSTAKES_REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://62.171.158.199:3100/0"
	}

	parsedOpts, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		log.Printf("❌ Failed to parse raw connection sequence string: %v", err)
		return nil, err
	}

	clientOpts := parsedOpts.(asynq.RedisClientOpt)

	var visionClient *vision.ImageAnnotatorClient
	var errVision error

	rawJSONKey := os.Getenv("GOOGLE_CREDENTIALS_JSON")

	var clientOptsList []option.ClientOption

	if rawJSONKey != "" && strings.HasPrefix(strings.TrimSpace(rawJSONKey), "{") {
		creds, errCreds := transport.Creds(ctx, option.WithCredentialsJSON([]byte(rawJSONKey)))
		if errCreds != nil {
			log.Printf("❌ Failed to parse memory credential configurations securely: %v", errCreds)
			return nil, errCreds
		}
		clientOptsList = append(clientOptsList, option.WithCredentials(creds))
	} else if rawJSONKey != "" {
		clientOptsList = append(clientOptsList, option.WithCredentialsFile(rawJSONKey))
	}

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

	// Fetch API key for Gemini multimodal pipeline operations
	geminiAPIKey := os.Getenv("GEMINI_API_KEY")
	if geminiAPIKey == "" {
		log.Println("⚠️ GEMINI_API_KEY is not configured in the active environment variables")
	}

	nodeWorkerURL := os.Getenv("WORKER_URL")
	if nodeWorkerURL == "" {
		if os.Getenv("NODE_ENV") == "production" {
			nodeWorkerURL = "http://node-worker-service:8083"
		} else {
			nodeWorkerURL = "http://localhost:8083"
		}
	}

	// Instantiate dependency context carrying existing engines and your new Gemini API token
	taskDeps := &tasks.DependencyContext{
		VisionClient: visionClient,
		OpenAIClient: openaiClient,
		GeminiAPIKey: geminiAPIKey,
		NodeClient:   tasks.NewNodeClient(nodeWorkerURL + "/internal"),
	}

	return &AppConfig{
		AsynqOpts:    clientOpts,
		TaskDeps:     taskDeps,
		VisionClient: visionClient,
	}, nil
}
