import express, { Express } from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./auth/routes";
import userRoutes from "./profile/routes";
import { initErrorHandlerMiddleware } from "@repo/security";
import { healthRouter } from "./health";
import { ErrorLogModel } from "@repo/database";

export default (app: Express) => {
  // Parsers and body size limits
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));
  app.use(cookieParser());

  // Service health check: api.funstakes.net/account/health
  app.use("/health", healthRouter());

  // api.funstakes.net/account
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes Account Service API" });
  });

  // Feature Routes
  app.use("/auth", authRoutes);
  app.use("/user", userRoutes);

  // Global Error handler
  app.use(initErrorHandlerMiddleware(ErrorLogModel));
  return app;
};
