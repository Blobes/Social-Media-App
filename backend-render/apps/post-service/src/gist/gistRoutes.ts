import { moderateContent, optVerifyToken, verifyAuthToken } from "@repo/shared";
import express, { Router } from "express";
import { getGistList } from "./controllers/getGistList";
import createGist from "./controllers/createGist";
import getGist from "./controllers/getGist";
import { gistLike } from "./controllers/gistLike";
import editGist from "./controllers/editGist";

const router: Router = express.Router();

router.get("/", optVerifyToken, getGistList);
router.post("/create", verifyAuthToken, moderateContent, createGist);
router.get("/:id", optVerifyToken, getGist);
router.post("/:id/like", verifyAuthToken, gistLike);
router.put("/:id/edit", verifyAuthToken, editGist);

export default router;
