import express, { Router } from "express";
import { markPostAsSeen } from "./markPost/markAsSeen";
import { optionallyAuthenicate, authenticate } from "../envVars";
import { translateCaption } from "./translate/translateCaption";
import { lookupTopics } from "./topic/lookup";
import { executePostTopicsUpdate } from "./topic/manage";
import { handleUserTopicRemoval } from "./topic/remove";
import { deleteUnusedTopics } from "./topic/delete";

const router: Router = express.Router();

router.patch("/:id/seen", optionallyAuthenicate, markPostAsSeen);
router.post("/translate/caption", authenticate, translateCaption);

router.post("/topic/search", authenticate, lookupTopics);
router.post("/topic/sync", authenticate, executePostTopicsUpdate);
router.patch("/topic/remove-preferences", authenticate, handleUserTopicRemoval);
router.delete("/topic/cleanup", authenticate, deleteUnusedTopics);

export default router;
