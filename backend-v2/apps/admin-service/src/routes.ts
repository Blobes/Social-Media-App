import { resolveFlaggedPost } from "@/controller/resolvePost.js";
import { isAdmin, moderateContent, verifyAuthToken } from "@repo/shared";
import express, { Router } from "express";

const router: Router = express.Router();

router.patch("/resolve-post", verifyAuthToken, isAdmin, resolveFlaggedPost);
router.post("/sync-post", verifyAuthToken, isAdmin, moderateContent);

export default router;
