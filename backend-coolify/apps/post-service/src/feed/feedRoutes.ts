import express, { Router } from "express";
import { getAllPost } from "./controllers/getAllPost";
import { getfollowersPosts } from "./controllers/followersPosts";
import { getUserPosts } from "./controllers/getUserPosts";
import { optionalAuth, verifyAuthToken } from "@/envVars";
import { getUserDraftPosts } from "./controllers/getDraftPosts";

const router: Router = express.Router();

// Testing api.funstakes.net/feed/test
router.get("/test", (req, res) => {
  res.json({ message: "Welcome to Funstakes Feed API" });
});

// Feed Logic
router.get("/", optionalAuth, getAllPost);
router.get("/followers", verifyAuthToken, getfollowersPosts);
router.get(":id/drafts", verifyAuthToken, getUserDraftPosts);
router.get("/:id", verifyAuthToken, getUserPosts);

export default router;
