package main

import (
	"context"
	"log"
	"os"

	"go-worker/tasks"

	"github.com/hibiken/asynq"
	"github.com/joho/godotenv"
)

type AppConfig struct {
	AsynqOpts asynq.RedisClientOpt
	TaskDeps  *tasks.DependencyContext
}

/**
 * Loads environment configurations and initializes connection-pooled cloud SDK clients.
 */
func LoadEnv(ctx context.Context) (*AppConfig, error) {
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

	// Instantiate dependency context carrying only the Gemini key and HTTP callback client
	taskDeps := &tasks.DependencyContext{
		GeminiAPIKey: geminiAPIKey,
		NodeClient:   tasks.NewNodeClient(nodeWorkerURL + "/internal"),
	}

	return &AppConfig{
		AsynqOpts: clientOpts,
		TaskDeps:  taskDeps,
	}, nil
}
