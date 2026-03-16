import { resolveFlaggedPost } from "@/controller/resolvePost.js";
import { isAdmin, moderateContent, verifyAuthToken } from "@repo/shared";
import express, { Router } from "express";

const router: Router = express.Router();

router.patch("/post/resolve", verifyAuthToken, isAdmin, resolveFlaggedPost);
router.post("/post/sync", verifyAuthToken, isAdmin, moderateContent);

export default router;
