import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import type { Server as HttpServer } from "http";

export function initSocket(httpServer: HttpServer) {
  // 1. Initialize Redis Clients for the Adapter
  const redisUrl = process.env.FUNSTAKES_REDIS_URL;
  if (!redisUrl) throw new Error("FUNSTAKES_REDIS_URL is missing");

  const pubClient = new Redis(redisUrl);
  const subClient = pubClient.duplicate();

  const io = new Server(httpServer, {
    cors: { origin: "*" }, // Adjust for production
  });

  // 2. Attach the Redis Adapter
  // This allows the Gateway to "hear" messages sent by the Worker's Emitter
  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    // Use auth instead of query for better security
    const userId =
      socket.handshake.auth.userId || socket.handshake.query.userId;

    if (userId) {
      // 3. Join a "Room" named after the User ID
      socket.join(`user:${userId}`);
      console.log(`👤 User ${userId} joined their private room.`);
    }

    socket.on("disconnect", () => {
      console.log("🔌 User disconnected");
    });
  });

  return io;
}
