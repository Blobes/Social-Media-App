import express from "express";
import { createServer } from "http";
import { healthRouter, initEnv, initUpstash } from "@repo/shared";
import appLoader from "./loader";
import { initSocket } from "./initSocket";

const startGateway = async () => {
  initEnv(); // Load the environment first
  initUpstash(); // Initialize Upstash Redis configuration

  const app = express();
  // Essential for getting real User IPs
  app.set("trust proxy", 1);

  const PORT = process.env.GATEWAY_PORT || 8000;

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
