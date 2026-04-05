import express, { Express } from "express";
import {
  corsConfig,
  mediaRouter,
  upstashClient,
  reportRouter,
  topicRouter,
} from "@repo/shared";
import { rateLimiter } from "./middleware/rateLimiter";
import gatewayRoutes from "./proxy";

export default async (app: Express) => {
  // ====== Middlewares ======
  app.use(corsConfig());
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));

  // Verify Upstash connectivity before starting the server
  try {
    const status = await upstashClient.ping();
    console.log(`✅ Redis connected: ${status}`);
  } catch (err) {
    // If Redis is down, we log it. The rateLimiter should handle "fail-open"
    // logic so your app doesn't crash if Upstash has a rare blip.
    console.error("⚠️ Redis Connectivity Check Failed:", err);
  }

  // Protect the entire stack with Rate Limiting – 100 requests per 60s window
  app.use(rateLimiter(100, 60));

  // Proxy to microservices
  app.use("/", gatewayRoutes);

  // Shared routes
  app.use("/report", reportRouter());
  app.use("/media", mediaRouter());
  app.use("/topic", topicRouter());

  return app;
};
