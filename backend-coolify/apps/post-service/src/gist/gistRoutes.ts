import { ContentModerator } from "@repo/shared";
import express, { Router } from "express";
import { getGistList } from "./controllers/getGistList";
import { gistLike } from "./controllers/gistLike";
import { createGist } from "./controllers/createGist";
import { editGist } from "./controllers/editGist";
import { getGist } from "./controllers/getGist";
import { OPENAI_API_KEY, optionalAuth, verifyAuthToken } from "@/envVars";

export const gistRouter = () => {
  const router: Router = express.Router();

  const moderateContent = ContentModerator(OPENAI_API_KEY);

  // Testing api.funstakes.net/gists/test
  router.get("/test", (req, res) => {
    res.json({ message: "Welcome to Funstakes Gist API" });
  });

  router.get("/", optionalAuth, getGistList);
  router.post("/create", verifyAuthToken, moderateContent, createGist);
  router.get("/:id", optionalAuth, getGist);
  router.post("/:id/like", verifyAuthToken, gistLike);
  router.put("/:id/edit", verifyAuthToken, editGist);

  return router;
};
