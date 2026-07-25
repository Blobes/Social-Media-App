import express from "express";
import appLoader from "./loader";
import { createServer } from "http";
import {
  initCacheClient,
  initQueueClient,
  initSocketReceiver,
} from "@repo/shared";
import {
  FUNSTAKES_REDIS_URL,
  NODE_ENV,
  PORT,
  GATEWAY_URL,
  JWT_SECRET,
} from "./envVars";
import { registerSocketListeners } from "./socket";

const startGateway = async () => {
  const app = express();
  const httpServer = createServer(app);

  initCacheClient(FUNSTAKES_REDIS_URL); // Initialize Redis cache pool
  initQueueClient(FUNSTAKES_REDIS_URL); // Initialize Queue engine pool

  // Mount Socket.IO server onto the HTTP server instance
  const io = initSocketReceiver(httpServer, FUNSTAKES_REDIS_URL, JWT_SECRET);
  registerSocketListeners(io);

  app.set("trust proxy", 1); // Essential for getting real User IPs

  // Load Global Middleware (CORS, Parsers, etc.)
  appLoader(app);

  // api.funstake.net
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes API Gateway" });
  });

  httpServer.listen(PORT, () => {
    console.log(`🚀 Gateway [${NODE_ENV}] running on port ${PORT}`);
    console.log(`📡 Public API Endpoint: ${GATEWAY_URL}`);
  });
};

startGateway();
