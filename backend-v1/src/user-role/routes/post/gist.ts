import express from "express";
import createGist from "@/user-role/controllers/post/gist/createGist";
import getGist from "@/user-role/controllers/post/gist/getGist";
import { gistLike } from "@/user-role/controllers/post/gist/gistLike";
import editGist from "@/user-role/controllers/post/gist/editGist";
import { getGistList } from "@/user-role/controllers/post/gist/getGistList";
import verifyAuthToken from "@/middlewares/verifyAuthToken";
import { optVerifyToken } from "@/middlewares/optVerifyToken";
import { moderateContent } from "@/middlewares/moderateContent";

const router = express.Router();

router.get("/", optVerifyToken, getGistList);
router.post("/create", verifyAuthToken, moderateContent, createGist);
router.get("/:id", optVerifyToken, getGist);
router.post("/:id/like", verifyAuthToken, gistLike);
router.put("/:id/edit", verifyAuthToken, editGist);

export default router;
