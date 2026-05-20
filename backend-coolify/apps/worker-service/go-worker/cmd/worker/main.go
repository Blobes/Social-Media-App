package main

import (
	"context"
	"log"
	"os"

	"go-worker/tasks"

	vision "cloud.google.com/go/vision/v2/apiv1"
	"github.com/hibiken/asynq"
	"github.com/sashabaranov/go-openai"
)

func main() {
	redisURL := os.Getenv("FUNSTAKES_REDIS_URL")
	if redisURL == "" {
		redisURL = "127.0.0.1:6379"
	}

	srv := asynq.NewServer(
		asynq.RedisClientOpt{Addr: redisURL},
		asynq.Config{
			Concurrency: 10,
			Queues: map[string]int{
				"critical":   6,
				"moderation": 3,
				"low":        1,
			},
		},
	)

	// Initialize long-lived cloud clients during bootstrap to enable internal connection pooling
	ctx := context.Background()
	visionClient, err := vision.NewImageAnnotatorClient(ctx)
	if err != nil {
		log.Fatalf("Failed to initialize system-wide Google Vision SDK: %v", err)
	}
	defer visionClient.Close()

	openAIKey := os.Getenv("OPENAI_API_KEY")
	if openAIKey == "" {
		openAIKey = "YOUR_OPENAI_API_KEY" // Fallback configuration layer target
	}
	openaiClient := openai.NewClient(openAIKey)

	// Instantiate the execution dependencies context container
	taskDeps := &tasks.DependencyContext{
		VisionClient: visionClient,
		OpenAIClient: openaiClient,
		NodeClient:   tasks.NewNodeClient("http://localhost:8083/internal/finalize-post"),
	}

	mux := asynq.NewServeMux()

	// Register task handler using a structural closure instead of a loose package function
	mux.HandleFunc("moderate:post", taskDeps.HandlePostModerationTask)

	log.Println("⚡ Go Worker Execution Engine active and waiting for tasks...")
	if err := srv.Run(mux); err != nil {
		log.Fatalf("Critical runtime failure within Go worker loop: %v", err)
	}
}
