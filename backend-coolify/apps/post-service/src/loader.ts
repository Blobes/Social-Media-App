import express, { Express } from "express";
import gistRoutes from "./gist/gistRoutes";
import feedRoutes from "./feed/feedRoutes";
import { corsConfig, healthRouter } from "@repo/shared";

export default (app: Express) => {
  // ====== Middlewares ======
  app.use(corsConfig());
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));

  // Service health check: api.funstakes.net/post/health
  app.use("/health", healthRouter("POST_SERVICE"));

  // This handles: api.funstakes.net/post
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Funstakes Post Service API" });
  });

  // ====== Routes ======
  app.use("/feed", feedRoutes);
  app.use("/gists", gistRoutes);

  return app;
};
