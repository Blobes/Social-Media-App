import { resolveFlaggedPost } from "@/controllers/resolvePost.js";
import { ContentModerator, isAdmin } from "@repo/shared";
import express, { Router } from "express";
import { OPENAI_API_KEY, verifyAuthToken } from "./envVars";

const adminRouter = () => {
  const router: Router = express.Router();

  const moderateContent = ContentModerator(OPENAI_API_KEY);

  router.patch("/resolve-post", verifyAuthToken, isAdmin, resolveFlaggedPost);
  router.post("/sync-post", verifyAuthToken, isAdmin, moderateContent);

  return router;
};

export default adminRouter;
