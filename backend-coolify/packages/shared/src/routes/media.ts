import express from "express";
import { MediaUploadHandler } from "../controller/media/getUploadUrl";
import { IMediaConfig } from "../types/types";

export const mediaRouter = (config: IMediaConfig) => {
  const router = express.Router();

  const getUploadUrlHandler = MediaUploadHandler(config.uploadConfig);

  router.post("/get-upload-url", config.verifyAuthToken, getUploadUrlHandler);

  return router;
};
