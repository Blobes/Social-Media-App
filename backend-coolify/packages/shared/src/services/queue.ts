import { Queue, QueueOptions } from "bullmq";
import { Redis } from "ioredis";

export class QueueService {
  private static redisConnection: QueueOptions["connection"] | null = null;
  private static instances: Map<string, Queue> = new Map();

  /**
   * Get or create a Redis connection for BullMQ
   */
  public static getConnection(
    redisUrl: string,
  ): NonNullable<QueueOptions["connection"]> {
    if (!this.redisConnection) {
      if (!redisUrl) throw new Error("FUNSTAKES_REDIS_URL is missing");

      const client = new Redis(redisUrl, {
        maxRetriesPerRequest: null, // Crucial for BullMQ
        connectTimeout: 10000, // Give it 10s to connect
      });

      // Add this to stop the "missing error handler" spam
      client.on("error", (err) => {
        console.error("❌ BullMQ Redis Error:", err.message);
      });

      this.redisConnection = client as unknown as QueueOptions["connection"];
      console.log("🛠️ BullMQ Redis Connection Attempted");
    }
    return this.redisConnection;
  }

  /**
   * Get a specific queue by name
   */
  public static getQueue<T = any>(
    queueName: string,
    redisUrl: string,
  ): Queue<T> {
    if (!this.instances.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: this.getConnection(redisUrl),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: true, // Keep Redis memory lean
          removeOnFail: false, // Keep failed jobs for debugging
        },
      });
      this.instances.set(queueName, queue);
    }
    return this.instances.get(queueName) as Queue<T>;
  }
}

// Named export for the specific queue you're using now
export const moderationQueue = (redisUrl: string) =>
  QueueService.getQueue("moderation-queue", redisUrl);
export const otpQueue = (redisUrl: string) =>
  QueueService.getQueue("otp-queue", redisUrl);
