import express from "express";
import verifyAuthToken from "@/middlewares/verifyAuthToken";
import { getfollowersPosts } from "@/user-role/controllers/post/feed/followersPosts";
import { getAllPost } from "@/user-role/controllers/post/feed/getAllPost";
import { getUserPosts } from "@/user-role/controllers/post/feed/getUserPosts";

const router = express.Router();

// Feed
router.get("/", verifyAuthToken, getAllPost);
router.get("/followers", verifyAuthToken, getfollowersPosts);
router.get("/:id", verifyAuthToken, getUserPosts);

export default router;
