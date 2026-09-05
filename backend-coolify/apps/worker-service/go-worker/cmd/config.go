package main

import (
	"context"
	"go-worker/tasks"
	"log"
	"os"

	"github.com/hibiken/asynq"
	"github.com/joho/godotenv"
)

type AppConfig struct {
	AsynqOpts asynq.RedisClientOpt
	TaskDeps  *tasks.DependencyContext
}

/* Loads environment configurations and initializes connection-pooled cloud SDK clients.
 */
func LoadConfig(ctx context.Context) (*AppConfig, error) {
	// Check the current environment flag, default to development if empty
	appEnv := os.Getenv("NODE_ENV")
	if appEnv == "" {
		appEnv = "development"
	}

	// Dynamic file path selection layer based on active target environment
	var envFile string
	if appEnv == "production" {
		envFile = "../../../.env.production"
	} else {
		envFile = "../../../.env.development"
	}

	// Attempt to load the selected configuration file, falling back to system environment variables if missing
	if err := godotenv.Load(envFile); err != nil {
		log.Printf("ℹ️ Local %s environment profile file not found, evaluating system context environment maps", envFile)

		// Fallback guard: if development file is missing, try loading production configurations as a safety layer
		if appEnv == "development" {
			if err := godotenv.Load("../../../.env.production"); err == nil {
				log.Println("ℹ️ Loaded production fallback configuration map layers for development runtime context")
			}
		}
	}

	redisURL := os.Getenv("FUNSTAKES_REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://62.171.158.199:6379/0"
	}

	parsedOpts, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		log.Printf("❌ Failed to parse raw connection sequence string: %v", err)
		return nil, err
	}

	clientOpts := parsedOpts.(asynq.RedisClientOpt)

	log.Printf("🔍 Redis connection initialized: %+v", clientOpts.Addr)

	openRouterAPIKey := os.Getenv("OPENROUTER_AI_MODERATOR_KEY")
	if openRouterAPIKey == "" {
		log.Println("⚠️ OPENROUTER_AI_MODERATOR_KEY is not configured in the active environment variables")
	}
	log.Printf("🔍 Open router api initialized")

	nodeWorkerURL := os.Getenv("WORKER_URL")
	if nodeWorkerURL == "" {
		if appEnv == "production" {
			nodeWorkerURL = "http://node-worker-service:8083"
		} else {
			nodeWorkerURL = "http://localhost:8083"
		}
	}

	primaryVisionModels := []string{
		"x-ai/grok-4.3",
		"google/gemini-3.5-flash",
		"anthropic/claude-sonnet-4.6",
	}
	fallbackVisionModels := []string{
		"anthropic/claude-opus-4.8",
		"x-ai/grok-4.20",
		"meta-llama/llama-3.2-11b-vision-instruct",
		"google/gemma-4-31b-it:free",
		"nvidia/nemotron-3-nano-omni:free",
	}

	storageRegion := os.Getenv("CLOUDFLARE_REGION")
	storageAccessKey := os.Getenv("CLOUDFLARE_ACCESS_KEY")
	storageSecretKey := os.Getenv("CLOUDFLARE_SECRET_KEY")
	storageBucketName := os.Getenv("CLOUDFLARE_BUCKET_NAME")
	storageClient, err := tasks.NewStorageClient(
		ctx,
		storageBucketName,
		storageRegion,
		storageAccessKey,
		storageSecretKey,
	)
	if err != nil {
		log.Printf("❌ Failed to initialize asset bucket cloud storage connection context: %v", err)
		return nil, err
	}

	taskDeps := &tasks.DependencyContext{
		OpenRouterAPIKey: openRouterAPIKey,
		PrimaryModels:    primaryVisionModels,
		FallbackModels:   fallbackVisionModels,
		NodeClient:       tasks.NewNodeClient(nodeWorkerURL + "/internal"),
		StorageClient:    storageClient,
	}

	return &AppConfig{
		AsynqOpts: clientOpts,
		TaskDeps:  taskDeps,
	}, nil
}
