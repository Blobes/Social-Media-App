import express, { Express } from "express";
import cookieParser from "cookie-parser";
import feedRoutes from "./feed/feedRoutes";
import postRoutes from "./shared/routes";
import { errorHandlerMiddleware, healthRouter } from "@repo/shared";
import { gistRouter } from "./gist/gistRoutes";
import sharedRoutes from "./shared/routes";

export default (app: Express) => {
  // ====== Middlewares ======
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));
  app.use(cookieParser());

  // Service health check: api.funstakes.net/post/health
  app.use("/health", healthRouter("POST_SERVICE"));

  // This handles: api.funstakes.net/post
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes Post Service API" });
  });

  // ====== Routes ======
  app.use("/post", postRoutes);
  app.use("/feed", feedRoutes);
  app.use("/gist", gistRouter());
  app.use("/", sharedRoutes);

  app.use(errorHandlerMiddleware);
  return app;
};
