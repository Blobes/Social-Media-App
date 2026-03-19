import express from "express";
import { corsConfig, healthRouter, initEnv } from "@repo/shared";
import gatewayRoutes from "./proxies";
import appLoader from "./loader";

initEnv(); // Load the environment first

const startGateway = async () => {
  const app = express();
  const PORT = process.env.PORT || 8000;

  // Middlewares
  app.use(corsConfig());

  appLoader(app);

  // Basic Gateway health check
  app.use("/health", healthRouter("GATEWAY"));

  // This handles: api.funstakes.net/
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
