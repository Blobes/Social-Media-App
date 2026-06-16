// apps/backend/src/routes/upload.ts
import express, { Router } from "express";
import { IUploadConfig } from "../types";
import {
  CompleteMultipartHandler,
  InitMultipartHandler,
  MediaUploadPolicyHandler,
  MediaUploadUrlHandler,
  SignPartHandler,
} from "../controller/upload/media";
import { LocalizationUpload } from "../controller/upload/localization";

export const uploadRouter = (config: IUploadConfig): Router => {
  const router = express.Router();

  const s3Config = config.uploadConfig;

  // --- Group 1: Standard Client Media Endpoints (Protected by User JWT) ---
  router.post(
    "/get-upload-policy",
    config.verifyAuthToken,
    MediaUploadPolicyHandler(s3Config),
  );
  router.post(
    "/get-upload-url",
    config.verifyAuthToken,
    MediaUploadUrlHandler(s3Config),
  );

  // --- Group 2: Chunked Large Media Multipart Endpoints (Protected by User JWT) ---
  router.post(
    "/multipart/init",
    config.verifyAuthToken,
    InitMultipartHandler(s3Config),
  );
  router.post(
    "/multipart/sign-part",
    config.verifyAuthToken,
    SignPartHandler(s3Config),
  );
  router.post(
    "/multipart/complete",
    config.verifyAuthToken,
    CompleteMultipartHandler(s3Config),
  );

  // --- Group 3: Server-To-Server System Sync Pipe (Protected strictly by Internal Secret Token) ---
  router.post(
    "/localization/sync",
    config.validateInternalToken,
    LocalizationUpload(s3Config),
  );

  return router;
};
