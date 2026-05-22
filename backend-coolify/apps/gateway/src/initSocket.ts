import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import type { Server as HttpServer } from "http";

let ioInstance: Server | null = null;
let pubClient: Redis | null = null;
let subClient: Redis | null = null;

/**
 * Initializes the global Socket.io server instance with a Redis adapter.
 * Enforces a strict singleton pattern to prevent socket close listener memory leaks.
 */
export function initRedisSocket(
  httpServer: HttpServer,
  redisUrl: string,
): Server {
  if (ioInstance) {
    return ioInstance;
  }

  if (!redisUrl) {
    throw new Error("FUNSTAKES_REDIS_URL is missing");
  }

  // Assign connections to the persistent file-level variables
  pubClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  subClient = pubClient.duplicate();

  ioInstance = new Server(httpServer, {
    cors: { origin: "*" },
  });

  ioInstance.adapter(createAdapter(pubClient, subClient));

  ioInstance.on("connection", (socket) => {
    const userId =
      socket.handshake.auth.userId || socket.handshake.query.userId;

    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`👤 User ${userId} joined their private room.`);
    }

    socket.on("disconnect", () => {
      console.log("🔌 User disconnected");
    });
  });

  // Handle clean resource teardowns on process terminations
  process.once("SIGTERM", async () => {
    if (pubClient) await pubClient.quit();
    if (subClient) await subClient.quit();
  });

  return ioInstance;
}
