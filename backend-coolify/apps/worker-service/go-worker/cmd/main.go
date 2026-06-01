package main

import (
	"context"
	"log"

	"github.com/hibiken/asynq"
)

/** Worker node entry engine process. */
func main() {
	ctx := context.Background()

	config, err := LoadConfig(ctx)
	if err != nil {
		log.Fatalf("Critical system bootstrap routine failure: %v", err)
	}

	srv := asynq.NewServer(
		config.AsynqOpts,
		asynq.Config{
			Concurrency: 2,
			Queues: map[string]int{
				"critical":   3,
				"moderation": 2,
				"low":        1,
			},
			ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
				log.Printf("❌ Task Execution Error [Type: %s]: %v", task.Type(), err)
			}),
		},
	)

	mux := asynq.NewServeMux()

	mux.HandleFunc("moderate:post", func(ctx context.Context, task *asynq.Task) error {
		log.Printf("✅ [Handler] Received task: %s", task.Type())
		log.Printf("📦 [Handler] Payload: %s", string(task.Payload()))
		err := config.TaskDeps.HandlePostModeration(ctx, task)
		if err != nil {
			log.Printf("❌ [Handler] Error: %v", err)
			return err
		}
		log.Printf("✅ [Handler] Task completed successfully")
		return nil
	})

	client := asynq.NewClient(config.AsynqOpts)
	defer client.Close()

	log.Println("⚡ Go Worker Execution Engine active and waiting for tasks...")
	if err := srv.Run(mux); err != nil {
		log.Fatalf("Critical runtime failure within Go worker loop: %v", err)
	}
}
