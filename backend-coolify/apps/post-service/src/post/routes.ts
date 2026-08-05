import express, { Router } from "express";
import { markPostAsSeen } from "./markPost/markAsSeen";
import { optionallyAuthenticate, authenticate } from "../envVars";
import { translateCaption } from "./translate/translateCaption";
import { lookupTopics } from "./topic/lookup";
import { syncPostTopics } from "./topic/sync";
import { autoInvalidatePostCache } from "@repo/shared";

const router: Router = express.Router();

// Read and operational endpoints (No cache invalidation required)
router.patch(
  "/:postId/seen",
  optionallyAuthenticate,
  autoInvalidatePostCache({ invalidatePostLanguages: false }),
  markPostAsSeen,
);
router.post("/translate/caption", authenticate, translateCaption);
router.post("/topic/search", authenticate, lookupTopics);

// Mutation endpoints
router.post(
  "/topic/sync",
  authenticate,
  autoInvalidatePostCache({}),
  syncPostTopics,
);

// router.delete("/topic/cleanup", authenticate, deleteUnusedTopics);

export default router;
