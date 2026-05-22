package main

import (
	"context"
	"log"

	"github.com/hibiken/asynq"
)

/**
 * Worker node entry engine process.
 */
func main() {
	ctx := context.Background()

	// Extract bootstrapping tasks onto our modular initialization companion file layer
	config, err := LoadEnvVars(ctx)
	if err != nil {
		log.Fatalf("Critical system bootstrap routine failure: %v", err)
	}
	defer config.VisionClient.Close()

	srv := asynq.NewServer(
		config.AsynqOpts,
		asynq.Config{
			Concurrency: 10,
			Queues: map[string]int{
				"critical":   6,
				"moderation": 3,
				"low":        1,
			},
		},
	)

	mux := asynq.NewServeMux()

	// Register structural closures safely out of the extracted dependency container context references
	mux.HandleFunc("moderate:post", config.TaskDeps.HandlePostModerationTask)

	log.Println("⚡ Go Worker Execution Engine active and waiting for tasks...")
	if err := srv.Run(mux); err != nil {
		log.Fatalf("Critical runtime failure within Go worker loop: %v", err)
	}
}
