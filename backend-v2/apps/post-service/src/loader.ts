import express, { Express } from "express";
import cookieParser from "cookie-parser";
import gistRoutes from "./gist/gistRoutes";
import { corsConfig, healthRouter } from "@repo/shared";

export default (app: Express) => {
  // ====== Middlewares ======
  app.use(corsConfig());
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));
  app.use(cookieParser());

  // Site health check
  app.use("/health", healthRouter("POST_SERVICE"));

  // ====== Routes ======
  app.use("/gists/v1", gistRoutes);

  return app;
};
