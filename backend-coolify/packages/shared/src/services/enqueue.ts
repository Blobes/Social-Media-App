import { Queue, QueueOptions } from "bullmq";
import { Redis } from "ioredis";
import { v4 as uuidv4 } from "uuid";
import { OtpJobPayload } from "../types/types";

export interface AsynqTaskOptions {
  queue?: string;
  maxRetry?: number;
  processAt?: number;
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

      this.redisConnection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
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
   * Enqueues a payload using the exact structural protocol the Go Asynq engine evaluates,
   * supporting both immediate and scheduled runtime operations.
   */
  public static async enqueueAsynqTask(
    redisUrl: string,
    typename: string,
    payload: Record<string, any>,
    options: AsynqTaskOptions = {},
  ): Promise<void> {
    const queue = options.queue || "default";
    const maxRetry = options.maxRetry ?? 3;
    const processAt = options.processAt;

    console.log("[enqueueAsynqTask] Enqueueing to queue:", queue); // ← ADD THIS

    const client = this.getConnection(redisUrl);
    const taskId = uuidv4();

    const asynqPayload = {
      Type: typename,
      Payload: Buffer.from(JSON.stringify(payload)).toString("base64"),
    };

    const taskMessage = {
      id: taskId,
      type: asynqPayload.Type,
      payload: asynqPayload.Payload,
      queue: queue,
      retry: maxRetry,
      completed_at: 0,
      timeout: 1800000000000,
      deadline: 0,
    };

    console.log("[enqueueAsynqTask] Task message:", taskMessage); // ← ADD THIS

    const messagePayloadString = JSON.stringify(taskMessage);
    const pipeline = client.pipeline();

    // Register queue name
    pipeline.sadd("asynq:queues", queue);

    if (processAt && processAt > Math.floor(Date.now() / 1000)) {
      const scheduledKey = `asynq:scheduled:${queue}`;
      pipeline.zadd(scheduledKey, processAt.toString(), taskId);
    } else {
      // Use Asynq's hash structure, not a list
      const hashKey = `asynq:h:${queue}`;
      const setKey = `asynq:t:${queue}`;

      console.log(
        "[enqueueAsynqTask] Using hashKey:",
        hashKey,
        "setKey:",
        setKey,
      ); // ← ADD THIS

      pipeline.hset(hashKey, taskId, messagePayloadString);
      pipeline.sadd(setKey, taskId);
    }

    await pipeline.exec();
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
