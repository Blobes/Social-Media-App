import { Queue, QueueOptions } from "bullmq";
import { Redis } from "ioredis";
import { v4 as uuidv4 } from "uuid";
import { OtpJobPayload } from "../types/types";

/**
 * Enqueues a payload into Redis using the exact structural binary protocol
 * that the Go Asynq library evaluates.
 */

interface AsynqTaskOptions {
  queue?: string;
  maxRetry?: number;
}

export class QueueService {
  private static redisConnection: Redis | null = null;
  private static bullInstances: Map<string, Queue> = new Map();

  /**
   * Get or create a unified, persistent connection pool for all queue architectures.
   */
  public static getConnection(redisUrl: string): Redis {
    if (!this.redisConnection) {
      if (!redisUrl) throw new Error("FUNSTAKES_REDIS_URL is missing");

      // Shared pool for both custom Asynq inserts and native BullMQ engines
      this.redisConnection = new Redis(redisUrl, {
        maxRetriesPerRequest: null, // Crucial requirement for BullMQ safety stability
        connectTimeout: 10000,
      });

      this.redisConnection.on("error", (err) => {
        console.error("❌ Shared Queue Engine Redis Error:", err.message);
      });

      console.log("🛠️ Unified Queue Service Redis Pool Connected");
    }
    return this.redisConnection;
  }

  /**
   * Get a specific managed BullMQ instance by name.
   */
  public static getBullQueue<
    DataType = any,
    ResultType = any,
    NameType extends string = string,
  >(
    queueName: string,
    redisUrl: string,
  ): Queue<DataType, ResultType, NameType> {
    if (!this.bullInstances.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: this.getConnection(
          redisUrl,
        ) as unknown as QueueOptions["connection"],
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });
      this.bullInstances.set(queueName, queue);
    }
    return this.bullInstances.get(queueName) as Queue<
      DataType,
      ResultType,
      NameType
    >;
  }

  /**
   * Enqueues a payload using the exact structural binary protocol the Go Asynq engine evaluates.
   */
  public static async enqueueAsynqTask(
    redisUrl: string,
    typename: string,
    payload: Record<string, any>,
    options: AsynqTaskOptions = {},
  ): Promise<void> {
    const queue = options.queue;
    const maxRetry = options.maxRetry ?? 3;

    const client = this.getConnection(redisUrl);
    const taskId = uuidv4();

    const asynqPayload = {
      typename,
      payload: Buffer.from(JSON.stringify(payload)).toString("base64"),
      queue,
      id: taskId,
      max_retry: maxRetry,
      retried: 0,
      timeout: 1800000000000,
      deadline: 0,
    };

    const redisKey = `asynq:{${queue}}`;
    const taskMessage = JSON.stringify(asynqPayload);
    const processAt = Math.floor(Date.now() / 1000);

    await client.zadd(redisKey, processAt.toString(), taskMessage);
  }
}

/**
 * Pushes heavy media assets directly into the Go Asynq protocol matrix.
 */
export const enqueueModerationTask = (
  redisUrl: string,
  typename: string,
  payload: Record<string, any>,
  options: Omit<AsynqTaskOptions, "queue"> = {},
) =>
  QueueService.enqueueAsynqTask(redisUrl, typename, payload, {
    ...options,
    queue: "moderation",
  });

/**
 * Dispatches high-priority auth verification tasks cleanly into native BullMQ engines.
 */
export const enqueueOtpTask = async (
  redisUrl: string,
  payload: OtpJobPayload,
): Promise<void> => {
  const queue = QueueService.getBullQueue<OtpJobPayload, any, "send_otp">(
    "otp_queue",
    redisUrl,
  );
  await queue.add("send_otp", payload);
};
