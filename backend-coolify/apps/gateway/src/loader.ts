import express, { Express } from "express";
import {
  corsConfig,
  uploadRouter,
  upstashClient,
  reportRouter,
  topicRouter,
  healthRouter,
} from "@repo/shared";
import { rateLimiter } from "./middleware/rateLimiter";
import gatewayRoutes from "./proxy";
import { s3Config, validateInternalToken, verifyAuthToken } from "./envVars";

export default async (app: Express) => {
  // 1. CORS and Rate Limiting
  app.use(corsConfig());
  app.use(rateLimiter(100, 60));
  // 2. Proxy to microservices before body parsers
  // This lets the raw data stream pass through to the internal services
  app.use("/", gatewayRoutes);

  // 3. Body Parsers come AFTER the proxy
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

  // 4. Gateway's own shared routes (these need the body parser above)
  app.use("/health", healthRouter("GATEWAY"));
  app.use("/report", reportRouter({ verifyAuthToken }));
  app.use(
    "/upload",
    uploadRouter({
      uploadConfig: s3Config,
      verifyAuthToken,
      validateInternalToken,
    }),
  );
  app.use("/topic", topicRouter({ verifyAuthToken }));

  return app;
};
