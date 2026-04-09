import express, { Express } from "express";
import adminRoutes from "./routes";
import { corsConfig, healthRouter } from "@repo/shared";

export default (app: Express) => {
  // ====== Middlewares ======
  app.use(corsConfig());
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));

  // Service health check:  api.funstakes.net/admin/health
  app.use("/health", healthRouter("ADMIN_SERVICE"));

  // api.funstakes.net/admin
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes Admin Service API" });
  });

  // ====== Routes ======
  app.use("/", adminRoutes);

  return app;
};
