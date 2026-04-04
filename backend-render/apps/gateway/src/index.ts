import express from "express";
import { createServer } from "http";
import { healthRouter, initEnv, initRedis } from "@repo/shared";
import appLoader from "./loader";
import { initSocket } from "./initSocket";

const startGateway = async () => {
  initEnv(); // Load the environment first
  initRedis(); // Initialize Redis configuration
  const app = express();
  // Essential for getting real User IPs through Render's load balancer
  app.set("trust proxy", 1);

  const PORT = process.env.GATEWAY_PORT || 8000;

  // Ultra-lightweight routes first
  app.get("/keep-alive", (req, res) => res.send("Gateway is awake"));
  app.use("/health", healthRouter("GATEWAY"));

  // Load Global Middleware (CORS, Parsers, etc.)
  appLoader(app);

  // api.funstake.net
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes API Gateway" });
  });

  const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Gateway [${process.env.NODE_ENV}] running on port ${PORT}`);
    console.log(`📡 Public API Endpoint: ${process.env.GATEWAY_URL}`);
  });
};

startGateway();
