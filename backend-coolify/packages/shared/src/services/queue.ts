import { Queue, QueueOptions } from "bullmq";
import { Redis } from "ioredis";

export class QueueService {
  private static redisConnection: QueueOptions["connection"] | null = null;
  private static instances: Map<string, Queue> = new Map();

  /**
   * Get or create a Redis connection for BullMQ
   */
  public static getConnection(): NonNullable<QueueOptions["connection"]> {
    if (!this.redisConnection) {
      const url = process.env.FUNSTAKES_REDIS_URL;
      if (!url) throw new Error("FUNSTAKES_REDIS_URL is missing");

      this.redisConnection = new Redis(url, {
        // BullMQ requirement: Max retries must be null
        maxRetriesPerRequest: null,
      }) as unknown as QueueOptions["connection"];
      console.log("🛠️ BullMQ Redis Connection Established");
    }
    return this.redisConnection;
  }

  /**
   * Get a specific queue by name
   */
  public static getQueue<T = any>(queueName: string): Queue<T> {
    if (!this.instances.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: this.getConnection(),
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
export const moderationQueue = QueueService.getQueue("moderation-queue");
export const otpQueue = QueueService.getQueue("otp-queue");
