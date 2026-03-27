import express from "express";
import { healthRouter, initEnv, initRedis, redisClient } from "@repo/shared";
import gatewayRoutes from "./proxy";
import appLoader from "./loader";
import { isSystemRoute, pingServices } from "./middleware/pinger";
import { rateLimiter } from "./middleware/rateLimiter";

const startGateway = async () => {
  initEnv(); // Load the environment first

  initRedis(); // Initialize Redis configuration

  const app = express();
  // Essential for getting real User IPs through Render's load balancer
  app.set("trust proxy", 1);

  const PORT = process.env.GATEWAY_PORT || 8000;

  // Verify Upstash connectivity before starting the server
  try {
    const status = await redisClient.ping();
    console.log(`✅ Redis connected: ${status}`);
  } catch (err) {
    // If Redis is down, we log it. The rateLimiter should handle "fail-open"
    // logic so your app doesn't crash if Upstash has a rare blip.
    console.error("⚠️ Redis Connectivity Check Failed:", err);
  }

  // Ultra-lightweight routes first
  app.get("/keep-alive", (req, res) => res.send("Gateway is awake"));
  app.use("/health", healthRouter("GATEWAY"));

  // Service Pinger (Runs on every request to ensure sub-services stay/get awake)
  app.use((req, res, next) => {
    if (!isSystemRoute(req.path)) pingServices();
    next();
  });

  // Proxy to microservices
  app.use("/", gatewayRoutes);

  // Load Global Middleware (CORS, Parsers, etc.)
  appLoader(app);

  // Protect the entire stack with Rate Limiting – 100 requests per 60s window
  app.use(rateLimiter(100, 60));

  // api.funstake.net
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes API Gateway" });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Gateway [${process.env.NODE_ENV}] running on port ${PORT}`);
    console.log(`📡 Public API Endpoint: ${process.env.GATEWAY_URL}`);
  });
};

startGateway();
