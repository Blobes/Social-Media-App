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

	config, err := LoadEnv(ctx)
	if err != nil {
		log.Fatalf("Critical system bootstrap routine failure: %v", err)
	}
	//	defer config.VisionClient.Close()

	srv := asynq.NewServer(
		config.AsynqOpts,
		asynq.Config{
			Concurrency: 2,
			Queues: map[string]int{
				"critical":   3,
				"moderation": 2,
				"low":        1,
			},
		},
	)

	mux := asynq.NewServeMux()

	// Register structural closures safely out of the extracted dependency container context references
	mux.HandleFunc("moderate:post", config.TaskDeps.HandlePostModeration)

	log.Println("⚡ Go Worker Execution Engine active and waiting for tasks...")
	if err := srv.Run(mux); err != nil {
		log.Fatalf("Critical runtime failure within Go worker loop: %v", err)
	}
}
