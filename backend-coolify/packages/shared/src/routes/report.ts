import express from "express";
import { flagPost } from "../controller/moderation/flagPost";
import { IVerifyAuth } from "../types/types";

export const reportRouter = (config: IVerifyAuth) => {
  const router = express.Router();

  router.post("/post", config.verifyAuthToken, flagPost);

  return router;
};
