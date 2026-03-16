import { moderateContent, optVerifyToken, verifyAuthToken } from "@repo/shared";
import express, { Router } from "express";
import { getGistList } from "./controller/getGistList";
import createGist from "./controller/createGist";
import getGist from "./controller/getGist";
import { gistLike } from "./controller/gistLike";
import editGist from "./controller/editGist";

const router: Router = express.Router();

router.get("/", optVerifyToken, getGistList);
router.post("/create", verifyAuthToken, moderateContent, createGist);
router.get("/:id", optVerifyToken, getGist);
router.post("/:id/like", verifyAuthToken, gistLike);
router.put("/:id/edit", verifyAuthToken, editGist);

export default router;
