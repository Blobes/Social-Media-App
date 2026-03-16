import { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { corsConfig } from "@/utils/express/config";

// Routes
import authRoutes from "@/user-role/routes/auth";
import userRoutes from "@/user-role/routes/user";
import gistRoutes from "@/user-role/routes/post/gist";
import feedRoutes from "@/user-role/routes/post/feed";
import mediaRoutes from "@/user-role/routes/media";
import topicRoutes from "@/user-role/routes/post/topic";
import moderationRoutes from "@/user-role/routes/moderation";

export default (app: Express) => {
  // ====== Middlewares ======
  app.use(corsConfig());
  app.use(bodyParser.json({ limit: "30mb" }));
  app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
  app.use(cookieParser());

  // Site health check
  app.get("/healthz", (_req: Request, res: Response) => {
    res.status(200).send("OK");
  });

  // ====== Routes ======
  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/feed", feedRoutes);
  app.use("/api/gists", gistRoutes);
  app.use("/api/media", mediaRoutes);
  app.use("/api/moderation", moderationRoutes);
  app.use("/api/topic", topicRoutes);

  return app;
};
