import express, { Router } from "express";
import { getAllPost } from "./controllers/getAllPost";
import { getUserPosts } from "./controllers/getUserPosts";
import { optionalAuth, verifyAuthToken } from "@/envVars";
import { getUserDraftPosts } from "./controllers/getDraftPosts";
import { getFollowersPosts } from "./controllers/followersPosts";

const router: Router = express.Router();

// Testing api.funstakes.net/feed/test
router.get("/test", (req, res) => {
  res.json({ message: "Welcome to Funstakes Feed API" });
});

// Feed Logic
router.get("/", optionalAuth, getAllPost);
router.get("/followers", verifyAuthToken, getFollowersPosts);
router.get(":id/drafts", verifyAuthToken, getUserDraftPosts);
router.get("/:id", verifyAuthToken, getUserPosts);

export default router;
