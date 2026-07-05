import express, { Express } from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./auth/authRoutes";
import userRoutes from "./user/userRoutes";
import { errorHandlerMiddleware, healthRouter } from "@repo/shared";

export default (app: Express) => {
  // ====== Middlewares ======
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));
  app.use(cookieParser());

  // Service health check: api.funstakes.net/account/health
  app.use("/health", healthRouter("ACCOUNT_SERVICE"));

  // api.funstakes.net/account
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes Account Service API" });
  });

  // ====== Use Routes ======
  app.use("/auth", authRoutes);
  app.use("/user", userRoutes);
  // Global Error handler
  app.use(errorHandlerMiddleware);
  return app;
};
