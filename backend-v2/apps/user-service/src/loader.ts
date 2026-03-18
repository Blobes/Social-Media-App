import express, { Express } from "express";
import cookieParser from "cookie-parser";
import userRoutes from "./routes";
import {
  corsConfig,
  feedRouter,
  healthRouter,
  mediaRouter,
  reportRouter,
} from "@repo/shared";

export default (app: Express) => {
  // ====== Middlewares ======
  app.use(corsConfig());
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));
  app.use(cookieParser());

  // Site health check
  app.use("/health", healthRouter("USER_SERVICE"));
  // ====== Routes ======
  app.use("/v1", userRoutes);
  app.use("/v1/feed", feedRouter());
  app.use("/v1/report", reportRouter());
  app.use("/v1/media", mediaRouter());

  return app;
};
