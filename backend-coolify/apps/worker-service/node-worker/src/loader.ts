import express, { Express } from "express";
import cookieParser from "cookie-parser";
import { healthRouter } from "@repo/shared";
import { internalRouter } from "./internal-api/routes";

export default (app: Express) => {
  // ====== Middlewares ======
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));
  app.use(cookieParser());

  // Site health check: api.funstakes.net/worker/health
  app.use("/health", healthRouter("WORKER_SERVICE"));

  // api.funstakes.net/worker
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes Worker Service API" });
  });

  app.use("/internal", internalRouter);

  return app;
};
