import express, { Router } from "express";
import { getGistList } from "./controllers/getGistList";
import { gistLike } from "./controllers/gistLike";
import { createGist } from "./controllers/createGist";
import { editGist } from "./controllers/editGist";
import { getGist } from "./controllers/getGist";
import { optionallyAuthenticate, authenticate } from "@/envVars";
import { draftGist } from "./controllers/draftGist";
import { autoInvalidatePostCache, autoInvalidateUserCache } from "@repo/shared";

export const gistRouter = () => {
  const router: Router = express.Router();

  // Testing api.funstakes.net/gists/test
  router.get("/test", (req, res) => {
    res.json({ message: "Welcome to Funstakes Gist API" });
  });

  // Read operations
  router.get("/feed", optionallyAuthenticate, getGistList);
  router.get("/:postId", optionallyAuthenticate, getGist);

  // Mutation operations
  router.post("/create", authenticate, createGist);

  router.post(
    "/draft",
    authenticate,
    autoInvalidateUserCache("POST_UPDATE"),
    draftGist,
  );

  router.post(
    "/:postId/like",
    authenticate,
    autoInvalidatePostCache({
      postType: "GIST",
      invalidatePostTypeFeed: false,
    }),
    gistLike,
  );

  router.put(
    "/:postId/edit",
    authenticate,
    autoInvalidatePostCache({
      postType: "GIST",
      invalidateGlobalFirstPage: true,
    }),
    editGist,
  );

  return router;
};
