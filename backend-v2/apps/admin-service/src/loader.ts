import express, { Express } from "express";
import cookieParser from "cookie-parser";
import adminRoutes from "./routes";
import { corsConfig, healthRouter } from "@repo/shared";

export default (app: Express) => {
  // ====== Middlewares ======
  app.use(corsConfig());
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));
  app.use(cookieParser());

  // Site health check
  app.use("/health", healthRouter("ADMIN_SERVICE"));

  // ====== Routes ======
  app.use("/v1", adminRoutes);

  return app;
};
