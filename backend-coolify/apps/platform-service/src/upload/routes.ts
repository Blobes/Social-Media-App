import { Router } from "express";
import { authenticateInternal, authenticate } from "@/envVars";
import {
  CompleteMultipartHandler,
  InitMultipartHandler,
  MediaUploadPolicyHandler,
  MediaUploadUrlHandler,
  SignPartHandler,
} from "./controllers/media";
import { LocalizationUpload } from "./controllers/localization";

const router: Router = Router();

// --- Group 1: Standard Client Media Endpoints (Protected by User JWT) ---
router.post("/get-upload-policy", authenticate, MediaUploadPolicyHandler);
router.post("/get-upload-url", authenticate, MediaUploadUrlHandler);

// --- Group 2: Chunked Large Media Multipart Endpoints (Protected by User JWT) ---
router.post("/multipart/init", authenticate, InitMultipartHandler);
router.post("/multipart/sign-part", authenticate, SignPartHandler);
router.post("/multipart/complete", authenticate, CompleteMultipartHandler);

// --- Group 3: Server-To-Server System Sync Pipe (Protected strictly by Internal Secret Token) ---
router.post("/localization/sync", authenticateInternal, LocalizationUpload);

export default router;
