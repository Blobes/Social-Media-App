import express, { Router } from "express";
import { getGistList } from "./controllers/getGistList";
import { gistLike } from "./controllers/gistLike";
import { createGist } from "./controllers/createGist";
import { editGist } from "./controllers/editGist";
import { getGist } from "./controllers/getGist";
import { optionalAuth, verifyAuthToken } from "@/envVars";
import { draftGist } from "./controllers/draftGist";

export const gistRouter = () => {
  const router: Router = express.Router();

  // Testing api.funstakes.net/gists/test
  router.get("/test", (req, res) => {
    res.json({ message: "Welcome to Funstakes Gist API" });
  });

  router.get("/", optionalAuth, getGistList);
  router.post("/create", verifyAuthToken, createGist);
  router.post("/draft", verifyAuthToken, draftGist);
  router.get("/:id", optionalAuth, getGist);
  router.post("/:id/like", verifyAuthToken, gistLike);
  router.put("/:id/edit", verifyAuthToken, editGist);

  return router;
};
