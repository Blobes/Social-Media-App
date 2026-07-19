import express, { Router } from "express";
import { getGistList } from "./controllers/getGistList";
import { gistLike } from "./controllers/gistLike";
import { createGist } from "./controllers/createGist";
import { editGist } from "./controllers/editGist";
import { getGist } from "./controllers/getGist";
import { optionallyAuthenicate, authenticate } from "@/envVars";
import { draftGist } from "./controllers/draftGist";

export const gistRouter = () => {
  const router: Router = express.Router();

  // Testing api.funstakes.net/gists/test
  router.get("/test", (req, res) => {
    res.json({ message: "Welcome to Funstakes Gist API" });
  });

  router.get("/feed", optionallyAuthenicate, getGistList);
  router.post("/create", authenticate, createGist);
  router.post("/draft", authenticate, draftGist);
  router.get("/:id", optionallyAuthenicate, getGist);
  router.post("/:id/like", authenticate, gistLike);
  router.put("/:id/edit", authenticate, editGist);

  return router;
};
