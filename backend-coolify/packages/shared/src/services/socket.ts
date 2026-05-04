import { Emitter } from "@socket.io/redis-emitter";
import { Redis } from "ioredis";

export class InternalSocketEmitter {
  private static instance: Emitter | null = null;
  private static redisClient: Redis | null = null;

  /**
   * Initializes or returns the existing Redis Emitter
   */
  public static getEmitter(redisUrl: string): Emitter {
    if (!this.instance) {
      // Ensure we have the environment variable
      if (!redisUrl) {
        throw new Error("FUNSTAKES_REDIS_URL is not defined");
      }

      // Initialize Redis only once
      this.redisClient = new Redis(redisUrl);
      this.instance = new Emitter(this.redisClient);

      console.log("🚀 Socket Emitter initialized via Redis");
    }
    return this.instance;
  }

  /**
   * Generic helper to send updates to a specific user
   */
  public static async notifyUser(
    userId: string,
    event: string,
    payload: any,
    redisUrl: string,
  ) {
    const io = this.getEmitter(redisUrl);
    // Socket.io Emitters are fire-and-forget (synchronous call to Redis)
    io.to(`user:${userId}`).emit(event, payload);
  }

  /**
   * Clean shutdown (useful for Railway SIGTERM events)
   */
  public static async disconnect() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.instance = null;
    }
  }
}
