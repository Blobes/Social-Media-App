import { lookupTopics } from "@/user-role/controllers/topic/lookup";
import { handleUserTopicRemoval } from "@/user-role/controllers/topic/remove";
import { manageTopics } from "@/user-role/controllers/topic/manage";
import verifyAuthToken from "@/middlewares/verifyAuthToken";
import express from "express";
import { deleteUnusedTopics } from "@/user-role/controllers/topic/delete";

const router = express.Router();

// I recommend changing "lookup" to a GET or POST with a clear search path.
// Since you are passing a body with 'alreadySelected', POST is fine,
// but "search" or "find" is more descriptive.
router.post("/search", verifyAuthToken, lookupTopics);

// This handles Preference, Post Creation, and Engagement.
// "sync" or "process" might be a more descriptive path since it's a multi-purpose logic.
router.post("/sync", verifyAuthToken, manageTopics);

// Removing items from a collection is traditionally a PATCH or DELETE.
// Since you are modifying the User's array (partially updating), PATCH is very fitting.
router.patch("/remove-preferences", verifyAuthToken, handleUserTopicRemoval);

// The background/admin cleanup is perfect as a DELETE.
router.delete("/cleanup", verifyAuthToken, deleteUnusedTopics);

export default router;
