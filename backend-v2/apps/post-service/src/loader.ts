import express, { Express, Request, Response } from "express";
import cookieParser from "cookie-parser";
import gistRoutes from "./gist/gist.routes";
import {
  corsConfig,
  feedRouter,
  healthRouter,
  mediaRouter,
  topicRouter,
} from "@repo/shared";

export default (app: Express) => {
  // ====== Middlewares ======
  app.use(corsConfig());
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));
  app.use(cookieParser());

  // Site health check
  app.use("/health", healthRouter("POST_SERVICE"));

  // ====== Routes ======
  app.use("/api/v1/gists", gistRoutes);
  app.use("/api/v1/feed", feedRouter());
  app.use("/api/v1/topic", topicRouter());
  app.use("/api/v1/media", mediaRouter());

  return app;
};
