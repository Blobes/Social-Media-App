import express from "express";
import { createServer } from "http";
import {
  initCacheClient,
  initQueueClient,
  initSocketReceiver,
} from "@repo/shared";
import appLoader from "./loader";
import { registerSocketListeners } from "./socket";
import {
  FUNSTAKES_REDIS_URL,
  GATEWAY_URL,
  JWT_SECRET,
  NODE_ENV,
  PORT,
} from "./envVars";

/**
 * Bootstraps the API Gateway server, socket engine, and service proxies.
 */
const startGateway = async (): Promise<void> => {
  const app = express();
  const httpServer = createServer(app);

  // Configure reverse proxy trust setting before rate limiters and proxies read req.ip
  app.set("trust proxy", 1);

  // Initialize background services and sockets
  await initCacheClient(FUNSTAKES_REDIS_URL);
  initQueueClient(FUNSTAKES_REDIS_URL);

  const io = initSocketReceiver(httpServer, FUNSTAKES_REDIS_URL, JWT_SECRET);
  registerSocketListeners(io);

  // Load middlewares, health check, and route proxies
  await appLoader(app);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Gateway [${NODE_ENV}] running on port ${PORT}`);
    console.log(`📡 Public API Endpoint: ${GATEWAY_URL}`);
  });
};

startGateway();
