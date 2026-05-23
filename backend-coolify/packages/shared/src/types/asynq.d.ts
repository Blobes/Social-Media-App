declare module "asynq" {
  interface EnqueueOptions {
    queue?: string;
    maxRetry?: number;
    delay?: number;
  }

  interface ClientConfig {
    redis: {
      addr: string;
    };
  }

  export class Client {
    constructor(config: ClientConfig);
    enqueue(
      typename: string,
      payload: Record<string, any>,
      options?: EnqueueOptions,
    ): Promise<void>;
    close(): Promise<void>;
  }
}
