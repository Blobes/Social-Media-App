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
			// Optional: Custom error handler to monitor pipeline failures explicitly
			ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
				log.Printf("❌ Task Execution Error [Type: %s]: %v", task.Type(), err)
			}),
		},
	)

	mux := asynq.NewServeMux()

	// Register structural closures safely out of the extracted dependency container context references
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

	// client := asynq.NewClient(config.AsynqOpts)
	// defer client.Close()

	// payload, err := json.Marshal(map[string]interface{}{
	// 	"postId":  "test123",
	// 	"userId":  "user123",
	// 	"caption": "test caption",
	// })
	// if err != nil {
	// 	log.Fatalf("❌ Failed to marshal payload: %v", err)
	// }

	// task := asynq.NewTask("moderate:post", payload, asynq.Queue("moderation"))

	// info, err := client.Enqueue(task)
	// if err != nil {
	// 	log.Fatalf("❌ Failed to enqueue test task: %v", err)
	// }
	// log.Printf("✅ Test task enqueued: %+v", info)

	// if err != nil {
	// 	log.Fatalf("❌ Failed to enqueue test task: %v", err)
	// }
	// log.Printf("✅ Test task enqueued: %+v", info)

	log.Println("⚡ Go Worker Execution Engine active and waiting for tasks...")
	if err := srv.Run(mux); err != nil {
		log.Fatalf("Critical runtime failure within Go worker loop: %v", err)
	}
}
