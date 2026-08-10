import express, { Express } from "express";
import cookieParser from "cookie-parser";
import feedRoutes from "./feed/routes";
import postRoutes from "./post/routes";
import { gistRouter } from "./gist/routes";
import { healthRouter } from "./health";
import { globalErrorHandler } from "@repo/security";
import { ErrorLogModel } from "@repo/database";

export default (app: Express) => {
  // Body parsers and cookies
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));
  app.use(cookieParser());

  // Service health check: api.funstakes.net/post/health
  app.use("/health", healthRouter("POST_SERVICE"));

  // This handles: api.funstakes.net/post
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes Post Service API" });
  });

  // Feature Routes
  app.use("/post", postRoutes);
  app.use("/feed", feedRoutes);
  app.use("/gist", gistRouter());

  app.use(globalErrorHandler(ErrorLogModel));
  return app;
};
