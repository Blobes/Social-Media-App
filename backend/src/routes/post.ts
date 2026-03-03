import express from "express";
import createGist from "@/controllers/post/gist/createGist";
import getGist from "@/controllers/post/gist/getGist";
import { likeGist } from "@/controllers/post/gist/likeGist";
import editGist from "@/controllers/post/gist/editGist";
import { getAllGist } from "@/controllers/post/gist/getAllGist";
import verifyAuthToken from "@/middlewares/verifyAuthToken";
import { optVerifyToken } from "@/middlewares/optVerifyToken";

const router = express.Router();
router.get("/", optVerifyToken, getAllGist);
router.post("/create", verifyAuthToken, createGist);
router.get("/:id", getGist);
router.put("/:id/like", verifyAuthToken, likeGist);
router.put("/:id/edit", verifyAuthToken, editGist);

export default router;
