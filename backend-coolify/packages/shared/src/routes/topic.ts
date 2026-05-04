import express from "express";
import { lookupTopics } from "../controller/topic/lookup";
import { deleteUnusedTopics } from "../controller/topic/delete";
import { manageTopics } from "../controller/topic/manage";
import { handleUserTopicRemoval } from "../controller/topic/remove";
import { IVerifyAuth } from "../types/types";

export const topicRouter = (config: IVerifyAuth) => {
  const router = express.Router();

  const verifyAuthToken = config.verifyAuthToken;

  router.post("/search", verifyAuthToken, lookupTopics);

  // This handles Preference, Post Creation, and Engagement.
  // "sync" or "process" might be a more descriptive path since it's a multi-purpose logic.
  router.post("/sync", verifyAuthToken, manageTopics);

  // Removing items from a collection is traditionally a PATCH or DELETE.
  // Since you are modifying the User's array (partially updating), PATCH is very fitting.
  router.patch("/remove-preferences", verifyAuthToken, handleUserTopicRemoval);

  // The background/admin cleanup is perfect as a DELETE.
  router.delete("/cleanup", verifyAuthToken, deleteUnusedTopics);

  return router;
};
