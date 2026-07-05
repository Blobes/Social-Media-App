import express, { Router } from "express";
import { flagPost } from "../controller/flagPost";
import { IVerifyAuth } from "../types";
import { auditAction } from "../middlewares/log";

export const reportRouter = (config: IVerifyAuth): Router => {
  const router = express.Router();

  router.post(
    "/post",
    config.verifyAuthToken,
    auditAction({ action: "Reported Post", category: "MODERATION" }),
    flagPost,
  );

  return router;
};
