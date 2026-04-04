import { verifyAuthToken } from "@repo/shared";
import express, { Router } from "express";
import { getAllPost } from "./controllers/getAllPost";
import { getfollowersPosts } from "./controllers/followersPosts";
import { getUserPosts } from "./controllers/getUserPosts";

const router: Router = express.Router();

// Feed Logic
router.get("/", verifyAuthToken, getAllPost);
router.get("/followers", verifyAuthToken, getfollowersPosts);
router.get("/:id", verifyAuthToken, getUserPosts);

export default router;
