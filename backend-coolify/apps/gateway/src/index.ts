import express from "express";
import appLoader from "./loader";
import { createServer } from "http";
import { initUpstash } from "@repo/shared";
import { initSocket } from "./initSocket";
import { FUNSTAKES_REDIS_URL, NODE_ENV, PORT, SERVICE_URL } from "./envVars";

const startGateway = async () => {
  const app = express();

  initUpstash(); // Initialize Upstash Redis configuration

  app.set("trust proxy", 1); // Essential for getting real User IPs

  // Load Global Middleware (CORS, Parsers, etc.)
  appLoader(app);

  // api.funstake.net
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes API Gateway" });
  });

  const httpServer = createServer(app);
  initSocket(httpServer, FUNSTAKES_REDIS_URL);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Gateway [${NODE_ENV}] running on port ${PORT}`);
    console.log(`📡 Public API Endpoint: ${SERVICE_URL}`);
  });
};

startGateway();
