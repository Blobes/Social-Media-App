import express from "express";
import createPost from "../controllers/post/create-post.js";
import getPost from "../controllers/post/get-post.js";
import likePost from "../controllers/post/like-post.js";
import editPost from "../controllers/post/edit-post.js";
import postTimeline from "../controllers/post/post-timeline.js";
import verifyToken from "@/middlewares/verifyToken.js";

const router = express.Router();
router.post("/create", verifyToken, createPost);
router.get("/:id", verifyToken, getPost);
router.put("/:id/like", verifyToken, likePost);
router.put("/:id/edit", verifyToken, editPost);
router.get("/:id/timeline", verifyToken, postTimeline);

export default router;
