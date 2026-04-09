import { moderateContent, optVerifyToken, verifyAuthToken } from "@repo/shared";
import express, { Router } from "express";
import { getGistList } from "./controllers/getGistList";
import { gistLike } from "./controllers/gistLike";
import { createGist } from "./controllers/createGist";
import { editGist } from "./controllers/editGist";
import { getGist } from "./controllers/getGist";

const router: Router = express.Router();

// Testing api.funstakes.net/gists/test
router.get("/test", (req, res) => {
  res.json({ message: "Welcome to Funstakes Gist API" });
});

router.get("/", optVerifyToken, getGistList);
router.post("/create", verifyAuthToken, moderateContent, createGist);
router.get("/:id", optVerifyToken, getGist);
router.post("/:id/like", verifyAuthToken, gistLike);
router.put("/:id/edit", verifyAuthToken, editGist);

export default router;
