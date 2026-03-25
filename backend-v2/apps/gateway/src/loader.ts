import express, { Express } from "express";
import {
  corsConfig,
  mediaRouter,
  reportRouter,
  topicRouter,
} from "@repo/shared";

export default (app: Express) => {
  // ====== Middlewares ======
  app.use(corsConfig());
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));

  // Shared routes
  app.use("/report", reportRouter());
  app.use("/media", mediaRouter());
  app.use("/topic", topicRouter());

  return app;
};
