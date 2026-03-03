import express from "express";
import createGist from "@/controllers/post/gist/createGist";
import getGist from "@/controllers/post/gist/getGist";
import { gistLike } from "@/controllers/post/gist/gistLike";
import editGist from "@/controllers/post/gist/editGist";
import { getGistList } from "@/controllers/post/gist/getGistList";
import verifyAuthToken from "@/middlewares/verifyAuthToken";
import { optVerifyToken } from "@/middlewares/optVerifyToken";

const router = express.Router();

// Gist
router.get("/", optVerifyToken, getGistList);
router.post("/create", verifyAuthToken, createGist);
router.get("/:id", optVerifyToken, getGist);
router.put("/:id/like", verifyAuthToken, gistLike);
router.put("/:id/edit", verifyAuthToken, editGist);

// Stake

export default router;
