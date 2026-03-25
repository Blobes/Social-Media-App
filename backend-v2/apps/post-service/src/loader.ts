import express, { Express } from "express";
import cookieParser from "cookie-parser";
import gistRoutes from "./gist/gistRoutes";
import feedRoutes from "./feed/feedRoutes";
import { corsConfig, healthRouter } from "@repo/shared";

export default (app: Express) => {
  // ====== Middlewares ======
  app.use(corsConfig());
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));
  app.use(cookieParser());

  // Site health check
  app.use("/health", healthRouter("POST_SERVICE"));

  // This handles: api.funstakes.net/feed
  app.get("/feed", (req, res) => {
    res.json({ message: "Welcome to Funstakes Feed API" });
  });
  // This handles: api.funstakes.net/user
  app.get("/gists", (req, res) => {
    res.json({ message: "Welcome to Funstakes Gist API" });
  });

  // ====== Routes ======
  app.use("/", feedRoutes);
  app.use("/", gistRoutes);

  return app;
};
