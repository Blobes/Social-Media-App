import express, { Router } from "express";
import { flagPost } from "../controller/flagPost";
import { IVerifyAuth } from "../types";

export const reportRouter = (config: IVerifyAuth): Router => {
  const router = express.Router();

  router.post("/post", config.verifyAuthToken, flagPost);

  return router;
};
