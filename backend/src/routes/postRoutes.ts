import express from "express";
import createPost from "@/controllers/post/createPost";
import getPost from "@/controllers/post/getPost";
import { likePost } from "@/controllers/post/likePost";
import editPost from "@/controllers/post/editPost";
import { getAllPost } from "@/controllers/post/getAllPost";
import verifyAuthToken from "@/middlewares/verifyAuthToken";
import { optVerifyToken } from "@/middlewares/optVerifyToken";

const router = express.Router();
router.get("/", optVerifyToken, getAllPost);
router.post("/create", verifyAuthToken, createPost);
router.get("/:id", getPost);
router.put("/:id/like", verifyAuthToken, likePost);
router.put("/:id/edit", verifyAuthToken, editPost);

export default router;
