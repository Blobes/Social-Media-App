import express from "express";
import createPost from "@/controllers/post/createPost";
import getPost from "@/controllers/post/getPost";
import { likePost } from "@/controllers/post/likePost";
import editPost from "@/controllers/post/editPost";
import { getAllPost } from "@/controllers/post/getAllPost";
import verifyToken from "@/middlewares/verifyToken";

const router = express.Router();
router.get("/", getAllPost);
router.post("/create", verifyToken, createPost);
router.get("/:id", getPost);
router.put("/:id/like", verifyToken, likePost);
router.put("/:id/edit", verifyToken, editPost);

export default router;
