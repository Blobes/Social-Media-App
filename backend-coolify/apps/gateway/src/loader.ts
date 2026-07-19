import express, { Express } from "express";
import { corsConfig, upstashClient } from "@repo/shared";
import { rateLimiter } from "./middleware/rateLimiter";
import gatewayRoutes from "./proxy";
import { healthRouter } from "./health";

export default async (app: Express) => {
  // CORS and Rate Limiting
  app.use(corsConfig());
  app.use(rateLimiter(100, 60));
  // Proxy to microservices before body parsers
  // This lets the raw data stream pass through to the internal services
  app.use("/", gatewayRoutes);

  // Body Parsers come AFTER the proxy
  // These will now only process requests intended for the Gateway's own routes
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));

  // Verify Upstash connectivity
  try {
    const status = await upstashClient.ping();
    console.log(`✅ Redis connected: ${status}`);
  } catch (err) {
    console.error("⚠️ Redis Connectivity Check Failed:", err);
  }

  // Gateway's own shared routes (these need the body parser above)
  app.use("/health", healthRouter());

  return app;
};
