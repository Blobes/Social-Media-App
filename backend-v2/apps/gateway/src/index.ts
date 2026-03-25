import express from "express";
import { healthRouter, initEnv, initRedis, redisClient } from "@repo/shared";
import gatewayRoutes from "./proxy";
import appLoader from "./loader";
import { pingServices } from "./middleware/pinger";
import { rateLimiter } from "./middleware/rateLimiter";

initEnv();

const startGateway = async () => {
  const app = express();
  // Essential for getting real User IPs through Render's load balancer
  app.set("trust proxy", 1);

  const PORT = process.env.PORT || 8000;

  // 1. Initialize Redis configuration
  initRedis();

  // 2. Verify Upstash connectivity before starting the server
  try {
    const status = await redisClient.ping();
    console.log(`✅ Redis connected: ${status}`);
  } catch (err) {
    // If Redis is down, we log it. The rateLimiter should handle "fail-open"
    // logic so your app doesn't crash if Upstash has a rare blip.
    console.error("⚠️ Redis Connectivity Check Failed:", err);
  }

  // 3. Ultra-lightweight routes first
  app.get("/keep-alive", (req, res) => res.send("Gateway is awake"));
  app.use("/health", healthRouter("GATEWAY"));

  // 4. Load Global Middleware (CORS, Parsers, etc.)
  appLoader(app);

  // 5. Protect the entire stack with Rate Limiting
  // 100 requests per 60s window
  app.use(rateLimiter(100, 60));

  // 6. Service Pinger (only runs for actual user traffic)
  app.use((req, res, next) => {
    if (req.path !== "/keep-alive" && req.path !== "/health") {
      pingServices();
    }
    next();
  });

  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes API Gateway" });
  });

  // 7. Proxy to microservices
  app.use("/", gatewayRoutes);

  app.listen(PORT, () => {
    console.log(`🚀 Gateway [${process.env.NODE_ENV}] running on port ${PORT}`);
    console.log(`📡 Public API Endpoint: ${process.env.GATEWAY_URL}`);
  });
};

startGateway();
