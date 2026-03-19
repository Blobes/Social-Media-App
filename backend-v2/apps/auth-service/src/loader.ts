import express, { Express } from "express";
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
  app.use("/auth/health", healthRouter("AUTH_SERVICE"));

  // This handles: api.funstakes.net/auth
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes Auth API" });
  });

  // ====== Routes ======
  app.use("/v1", authRoutes);

  return app;
};
