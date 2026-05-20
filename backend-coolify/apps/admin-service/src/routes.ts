import { resolveFlaggedPost } from "@/controllers/resolvePost.js";
import { isAdmin } from "@repo/shared";
import express, { Router } from "express";
import { verifyAuthToken } from "./envVars";

const adminRouter = () => {
  const router: Router = express.Router();

  router.patch("/resolve-post", verifyAuthToken, isAdmin, resolveFlaggedPost);

  return router;
};

export default adminRouter;
