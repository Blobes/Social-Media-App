import express from "express";
import verifyAuthToken from "@/middlewares/verifyAuthToken";
import { refreshAuthToken } from "@/middlewares/refreshAuthToken";
import { createAccount } from "@/user-role/controllers/auth/internal/createAccount";
import loginUser from "@/user-role/controllers/auth/internal/login";
import logoutUser from "@/user-role/controllers/auth/logout";
import { verifyUserAuth } from "@/user-role/controllers/auth/verifyUserAuth";
import { verifyEmailCode } from "@/user-role/controllers/auth/internal/verifyEmailCode";
import { resendEmailCode } from "@/user-role/controllers/auth/internal/resendEmailCode";
import { checkEmail } from "@/user-role/controllers/auth/check/email";
import { checkUsername } from "@/user-role/controllers/auth/check/username";

const router = express.Router();

// --- DISCOVERY & AVAILABILITY ---
// Public endpoints used during registration to check if data is unique
router.post("/check-email", checkEmail);
router.post("/check-username", checkUsername);

// --- ACCOUNT ONBOARDING ---
router.post("/register", createAccount);
router.put("/verify-email-code", verifyEmailCode);
router.post("/resend-email-code", resendEmailCode);

// --- SESSION MANAGEMENT ---
router.post("/login", loginUser);
router.post("/refresh", refreshAuthToken);
router.post("/logout", logoutUser);

// --- IDENTITY VERIFICATION ---
// Used by the client to sync the current user state on app load
router.get("/verify-auth", verifyAuthToken, verifyUserAuth);

export default router;
