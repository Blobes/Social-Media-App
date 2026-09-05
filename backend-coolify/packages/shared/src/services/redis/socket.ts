import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Emitter } from "@socket.io/redis-emitter";
import { Redis } from "ioredis";
import jwt from "jsonwebtoken";
import type { Server as HttpServer } from "http";
import { IJwtUser } from "../../types/general";
import { getCorsOptions } from "../../../env-config/corsConfig";

export interface AuthenticatedSocket extends Socket {
  user?: IJwtUser;
}

export class SocketService {
  private static defaultRedisUrl: string | null = null;
  private static ioInstance: Server | null = null;
  private static pubClient: Redis | null = null;
  private static subClient: Redis | null = null;
  private static emitterInstance: Emitter | null = null;
  private static emitterRedisClient: Redis | null = null;

  private static resolveUrl(redisUrl?: string): string {
    const url =
      redisUrl || this.defaultRedisUrl || process.env.FUNSTAKES_REDIS_URL;
    if (!url) {
      throw new Error("FUNSTAKES_REDIS_URL is missing.");
    }
    return url;
  }

  /**
   * Initializes the WebSocket Gateway Server with JWT auth middleware and Redis Adapter.
   */
  public static initSocketServer(
    httpServer: HttpServer,
    redisUrl?: string,
    jwtSecret = process.env.JWT_SECRET,
  ): Server {
    const customCorsOptions = getCorsOptions();

    if (this.ioInstance) {
      return this.ioInstance;
    }

    const targetUrl = this.resolveUrl(redisUrl);
    this.defaultRedisUrl = targetUrl;

    this.pubClient = new Redis(targetUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    this.subClient = this.pubClient.duplicate();

    this.ioInstance = new Server(httpServer, {
      cors: customCorsOptions,
    });

    this.ioInstance.adapter(createAdapter(this.pubClient, this.subClient));

    // Middleware: Decode and verify JWT token using IJwtUser structure
    this.ioInstance.use((socket: AuthenticatedSocket, next) => {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      try {
        const decoded = jwt.verify(token, jwtSecret as string) as IJwtUser;

        if (!decoded || !decoded.id) {
          return next(
            new Error("Invalid token payload: missing user identifier"),
          );
        }

        socket.user = decoded;
        next();
      } catch (err: any) {
        return next(
          new Error(`Unauthorized socket connection: ${err.message}`),
        );
      }
    });

    this.ioInstance.on("connection", (socket: AuthenticatedSocket) => {
      const userId = socket.user?.id?.toString();

      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`👤 Verified User ${userId} joined room user:${userId}`);
      }

      socket.on("disconnect", () => {
        console.log(`🔌 Verified User ${userId} disconnected`);
      });
    });

    process.once("SIGTERM", async () => {
      if (this.pubClient) await this.pubClient.quit();
      if (this.subClient) await this.subClient.quit();
    });

    console.log(
      "⚡ Socket.IO Server initialized with JWT auth & Redis Adapter",
    );
    return this.ioInstance;
  }

  /**
   * Initializes the Redis Emitter for headless microservices.
   */
  public static initEmitter(redisUrl?: string): Emitter {
    if (!this.emitterInstance) {
      const targetUrl = this.resolveUrl(redisUrl);
      this.defaultRedisUrl = targetUrl;

      this.emitterRedisClient = new Redis(targetUrl);
      this.emitterInstance = new Emitter(this.emitterRedisClient);

      console.log("🚀 Socket Emitter initialized via Redis");
    }
    return this.emitterInstance;
  }

  /**
   * Emits a fire-and-forget socket event directly to a targeted user's room.
   */
  public static async notifyUser(
    userId: string,
    event: string,
    payload: any,
    redisUrl?: string,
  ): Promise<void> {
    const emitter = this.initEmitter(redisUrl);
    emitter.to(`user:${userId}`).emit(event, payload);
  }

  /**
   * Graceful disconnection for emitter client.
   */
  public static async disconnectEmitter(): Promise<void> {
    if (this.emitterRedisClient) {
      await this.emitterRedisClient.quit();
      this.emitterInstance = null;
      this.emitterRedisClient = null;
    }
  }
}

/**
 Socket receiver initialized in Gateway.
 */
export const initSocketReceiver = (
  httpServer: HttpServer,
  redisUrl?: string,
  jwtSecret?: string,
) => SocketService.initSocketServer(httpServer, redisUrl, jwtSecret);

/**
 Socket emitter initialized in Microservices.
 */
export const initSocketEmitter = (redisUrl?: string) =>
  SocketService.initEmitter(redisUrl);

/**
 Notification dispatcher.
 */
export const notifyUser = (
  userId: string,
  event: string,
  payload: any,
  redisUrl?: string,
) => SocketService.notifyUser(userId, event, payload, redisUrl);
