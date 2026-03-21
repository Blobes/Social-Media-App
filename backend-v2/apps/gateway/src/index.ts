import express from "express";
import { healthRouter, initEnv } from "@repo/shared";
import gatewayRoutes from "./proxies";
import appLoader from "./loader";
import { pingServices } from "./pinger";

initEnv(); // Load the environment first

const startGateway = async () => {
  const app = express();
  const PORT = process.env.PORT || 8000;

  // Load app
  appLoader(app);

  // Secret route for cron-job (Does NOT wake up sub-services)
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

  // Other services routes
  app.use("/", gatewayRoutes);

  app.listen(PORT, () => {
    console.log(`🚀 Gateway [${process.env.NODE_ENV}] running on port ${PORT}`);
    console.log(`📡 Public API Endpoint: ${process.env.GATEWAY_URL}`);
  });
};

startGateway();
