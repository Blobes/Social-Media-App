import express from "express";
import { verifyAuthToken } from "../middlewares/authToken";
import { flagPost } from "../controller/moderation/flagPost";

export const reportRouter = () => {
  const router = express.Router();

  router.post("/post", verifyAuthToken, flagPost);

  return router;
};
