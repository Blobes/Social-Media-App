import express, { Express } from "express";
import cookieParser from "cookie-parser";
import notificationRoutes from "./notification/routes";
import uploadRoutes from "./upload/routes";
import auditRoutes from "./audit-log/routes";
import moderationRoutes from "./moderation/routes";
import { healthRouter } from "./health";
import { initErrorHandlerMiddleware } from "@repo/security";
import { ErrorLogModel } from "@repo/database";

export default (app: Express) => {
  // Body parsers and cookies
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));
  app.use(cookieParser());

  // Service health check: api.funstakes.net/admin/health
  app.use("/health", healthRouter());

  // api.funstakes.net/platform
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes Platform Service API" });
  });

  // Feature Routes
  app.use("/notification", notificationRoutes);
  app.use("/upload", uploadRoutes);
  app.use("/audit", auditRoutes);
  app.use("/moderation", moderationRoutes);

  app.use(initErrorHandlerMiddleware(ErrorLogModel));

  return app;
};
