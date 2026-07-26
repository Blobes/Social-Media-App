import express, { Express } from "express";
import { corsConfig } from "@repo/shared";
import { rateLimiter } from "./rateLimiter";
import gatewayRoutes from "./proxy";
import { healthRouter } from "./health";

/**
 * Loads CORS, rate limiting, health checks, body parsers, and proxy routes.
 */
export default async (app: Express): Promise<Express> => {
  // CORS configuration
  app.use(corsConfig());

  // Gateway health check endpoint (runs before rate limits and proxying)
  app.use("/health", healthRouter());

  // Gateway root endpoint
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes API Gateway" });
  });

  // Global rate limiter
  app.use(rateLimiter(100, 60));

  // Microservice Proxy Routes
  app.use("/", gatewayRoutes);

  // Body Parsers for local Gateway routes
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));

  return app;
};
