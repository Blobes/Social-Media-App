import { flagPost } from "@/user-role/controllers/moderation/flagPost";
import { resolveFlaggedPost } from "@/admin-role/resolvePost";
import { moderateContent } from "@/middlewares/moderateContent";
import verifyAuthToken from "@/middlewares/verifyAuthToken";
import { isAdmin } from "@/middlewares/isAdmin"; // Protecting sensitive routes
import express from "express";

const router = express.Router();

// Public/User Routes
// Allows any authenticated user or AI to report content
router.post("/report", verifyAuthToken, flagPost);

// Admin-Only Routes
// These update existing states and require higher permissions
router.patch("/resolve", verifyAuthToken, isAdmin, resolveFlaggedPost);
router.post("/sync", verifyAuthToken, isAdmin, moderateContent);

export default router;
