import { Queue, QueueOptions } from "bullmq";
import { Redis } from "ioredis";
import { Client as AsynqClient, Task as AsynqTask } from "node-asynq";
import { OtpJobPayload } from "../../types/general";
import { CACHE_EXPIRY } from "../../constants/cacheKeys";

export interface AsynqTaskOptions {
  queue?: string;
  maxRetry?: number;
  processAt?: number;
  retention?: number;
}

export class QueueService {
  private static defaultRedisUrl: string | null = null;
  private static redisConnection: Redis | null = null;
  private static asynqClientInstance: AsynqClient | null = null;
  private static bullInstances: Map<string, Queue> = new Map();

  /**
   * Initializes the queue service with a default Redis URL pool.
   */
  public static init(redisUrl?: string): void {
    const targetUrl = redisUrl || process.env.FUNSTAKES_REDIS_URL;
    if (!targetUrl) {
      throw new Error("FUNSTAKES_REDIS_URL is missing");
    }
    this.defaultRedisUrl = targetUrl;
    this.getConnection(targetUrl);
  }

  /**
   * Helper to resolve the explicitly provided or stored default Redis connection URL.
   */
  private static resolveUrl(redisUrl?: string): string {
    const url =
      redisUrl || this.defaultRedisUrl || process.env.FUNSTAKES_REDIS_URL;
    if (!url) {
      throw new Error(
        "FUNSTAKES_REDIS_URL is missing. Call initQueueClient first.",
      );
    }
    return url;
  }

  /**
   * Get or create a unified, persistent connection pool for all queue architectures.
   */
  public static getConnection(redisUrl?: string): Redis {
    const targetUrl = this.resolveUrl(redisUrl);

    if (!this.redisConnection) {
      this.redisConnection = new Redis(targetUrl, {
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
   * Get or create a unified Asynq client instance wrapper.
   */
  public static getAsynqClient(redisUrl?: string): AsynqClient {
    const targetUrl = this.resolveUrl(redisUrl);

    if (!this.asynqClientInstance) {
      try {
        const parsedUrl = new URL(targetUrl);
        const redisOptions: any = {
          host: parsedUrl.hostname,
          port: parseInt(parsedUrl.port || "6379", 10),
          db: parseInt(parsedUrl.pathname.replace("/", "") || "0", 10),
        };

        if (parsedUrl.password) {
          redisOptions.password = decodeURIComponent(parsedUrl.password);
        } else if (parsedUrl.username && !parsedUrl.password) {
          redisOptions.password = decodeURIComponent(parsedUrl.username);
        }

        this.asynqClientInstance = new AsynqClient(redisOptions);
        console.log("🛠️ Native Asynq Client Engine Instance Connected");
      } catch (err: any) {
        console.error(
          "❌ Failed to initialize standard Asynq parser layout:",
          err.message,
        );
        throw err;
      }
    }
    return this.asynqClientInstance;
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
    redisUrl?: string,
  ): Queue<DataType, ResultType, NameType> {
    const targetUrl = this.resolveUrl(redisUrl);

    if (!this.bullInstances.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: this.getConnection(
          targetUrl,
        ) as unknown as QueueOptions["connection"],
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
          // Retain completed jobs for 1 hour or max 500 count
          removeOnComplete: {
            age: CACHE_EXPIRY.HOUR_1,
            count: 500,
          },
          // Retain failed jobs for 24 hours or max 1000 count
          removeOnFail: {
            age: CACHE_EXPIRY.HOUR_24,
            count: 1000,
          },
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
   * Enqueues a payload using the exact structural protocol the Go Asynq engine evaluates.
   */
  public static async enqueueAsynqTask(
    typename: string,
    payload: Record<string, any>,
    options: AsynqTaskOptions = {},
    redisUrl?: string,
  ): Promise<void> {
    const queue = options.queue || "default";
    const maxRetry = options.maxRetry ?? 3;
    const processAt = options.processAt;
    const retention = options.retention ?? CACHE_EXPIRY.HOUR_2; // Default to 2 hours retention (in seconds)

    console.log(
      "[enqueueAsynqTask] Dispatching payload task using node-asynq to queue:",
      queue,
    );

    try {
      const client = this.getAsynqClient(redisUrl);
      const task = new AsynqTask(typename, payload);

      const taskOptions: Record<string, unknown> = {
        queue,
        retry: maxRetry,
        retention,
      };

      if (processAt && processAt > Math.floor(Date.now() / 1000)) {
        taskOptions.processAt = processAt * 1000;
      }

      await client.enqueue(task, taskOptions);
      console.log("✅ Asynq task registered into broker states seamlessly");
    } catch (err: any) {
      console.error(
        "❌ Failed enqueueing task via node-asynq library configuration:",
        err.message,
      );
      throw err;
    }
  }
}

/**
 * Initializes the Queue Engine once at the entry point of the app server.
 */
export const initQueueClient = (redisUrl?: string): void =>
  QueueService.init(redisUrl);

export const getQueueConnection = (redisUrl?: string) =>
  QueueService.getConnection(redisUrl);

export interface ModerationTaskInput {
  typename: string;
  payload: Record<string, any>;
  options?: Omit<AsynqTaskOptions, "queue">;
  redisUrl?: string;
}
/**
 * Pushes heavy media assets directly into the Go Asynq protocol matrix.
 */
export const enqueueModerationTask = (input: ModerationTaskInput) => {
  const { typename, payload, options = {}, redisUrl } = input;
  return QueueService.enqueueAsynqTask(
    typename,
    payload,
    {
      ...options,
      queue: "moderation",
    },
    redisUrl,
  );
};

/**
 * Dispatches high-priority auth verification tasks cleanly into native BullMQ engines.
 */
export const enqueueOtpTask = async (
  payload: OtpJobPayload,
  redisUrl?: string,
): Promise<void> => {
  const queue = QueueService.getBullQueue<OtpJobPayload, any, "send_otp">(
    "otp_queue",
    redisUrl,
  );
  await queue.add("send_otp", payload);
};
