import express from "express";
import { verifyAuthToken } from "../middlewares/verifyAuthToken";
import { getAllPost } from "../controller/feed/getAllPost";
import { getfollowersPosts } from "../controller/feed/followersPosts";
import { getUserPosts } from "../controller/feed/getUserPosts";

export const feedRouter = () => {
  const router = express.Router();

  // Feed Logic
  router.get("/", verifyAuthToken, getAllPost);
  router.get("/followers", verifyAuthToken, getfollowersPosts);
  router.get("/:id", verifyAuthToken, getUserPosts);

  return router;
};
