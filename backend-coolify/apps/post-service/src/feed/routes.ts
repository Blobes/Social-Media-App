import express, { Router } from "express";
import { getAllPost } from "./controllers/getAllPost";
import { getUserPosts } from "./controllers/getUserPosts";
import { optionallyAuthenicate, authenticate } from "@/envVars";
import { getUserDraftPosts } from "./controllers/getDraftPosts";
import { getFollowersPosts } from "./controllers/followersPosts";

const router: Router = express.Router();

// Testing api.funstakes.net/feed/test
router.get("/test", (req, res) => {
  res.json({ message: "Welcome to Funstakes Feed API" });
});

// Feed Logic
router.get("/", optionallyAuthenicate, getAllPost);
router.get("/followers", authenticate, getFollowersPosts);
router.get(":id/drafts", authenticate, getUserDraftPosts);
router.get("/:id", authenticate, getUserPosts);

export default router;
