import express from "express";
import { corsConfig, healthRouter, initEnv } from "@repo/shared";
import gatewayRoutes from "./proxies";
import appLoader from "./loader";
import { pingServices } from "./pinger";

initEnv(); // Load the environment first

const startGateway = async () => {
  const app = express();
  const PORT = process.env.PORT || 8000;

  // Load config
  app.use(corsConfig());

  appLoader(app);

  // 1. Secret route for cron-job (Does NOT wake up sub-services)
  app.get("/keep-alive", (req, res) => {
    res.send("Gateway is awake");
  });

  // Ping other services only when user visits
  app.use((req, res, next) => {
    if (req.path !== "/keep-alive") {
      pingServices();
    }
    next();
  });

  // Basic Gateway health check
  app.use("/health", healthRouter("GATEWAY"));

  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes API Gateway" });
  });

  app.use("/", gatewayRoutes);

  app.listen(PORT, () => {
    console.log(`🚀 Gateway [${process.env.NODE_ENV}] running on port ${PORT}`);
    console.log(`📡 Public API Endpoint: https://api.funstakes.net`);
  });
};

startGateway();
