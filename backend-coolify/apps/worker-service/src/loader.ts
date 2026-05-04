import express, { Express } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { corsConfig, healthRouter } from "@repo/shared";

export default (app: Express) => {
  dotenv.config();

  // ====== Middlewares ======
  app.use(corsConfig());
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));
  app.use(cookieParser());

  // Site health check: api.funstakes.net/worker/health
  app.use("/health", healthRouter("WORKER_SERVICE"));

  // api.funstakes.net/worker
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes Worker Service API" });
  });

  return app;
};
