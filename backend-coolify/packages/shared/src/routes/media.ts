import express, { Router } from "express";
import { IMediaConfig } from "../types";
import {
  CompleteMultipartHandler,
  InitMultipartHandler,
  MediaUploadPolicyHandler,
  MediaUploadUrlHandler,
  SignPartHandler,
} from "../controller/media/upload";

export const mediaRouter = (config: IMediaConfig): Router => {
  const router = express.Router();

  router.use(config.verifyAuthToken);

  const s3Config = config.uploadConfig;

  // const getUploadUrlHandler = MediaUploadHandler(config.uploadConfig);

  // Standard Image/Video file payload endpoints
  router.post("/get-upload-policy", MediaUploadPolicyHandler(s3Config));
  router.post("/get-upload-url", MediaUploadUrlHandler(s3Config));

  // Chunked Large Media Multipart processing pipeline endpoints
  router.post("/multipart/init", InitMultipartHandler(s3Config));
  router.post("/multipart/sign-part", SignPartHandler(s3Config));
  router.post("/multipart/complete", CompleteMultipartHandler(s3Config));

  // router.post("/get-upload-url", config.verifyAuthToken, getUploadUrlHandler);

  return router;
};
