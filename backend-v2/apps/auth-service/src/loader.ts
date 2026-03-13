import express, { Express, Request, Response } from "express";
import cookieParser from "cookie-parser";

// Routes
import authRoutes from "./routes";
import { corsConfig, healthRouter } from "@repo/shared";

export default (app: Express) => {
  // ====== Middlewares ======
  app.use(corsConfig());
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));
  app.use(cookieParser());

  // Site health check
  app.use("/health", healthRouter("AUTH_SERVICE"));

  // ====== Routes ======
  app.use("/api/v1/auth", authRoutes);

  return app;
};
