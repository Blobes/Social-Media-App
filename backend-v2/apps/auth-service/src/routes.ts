import express, { Router } from "express";
import { checkEmail } from "./controller/check/email";
import { checkUsername } from "./controller/check/username";
import { createAccount } from "./controller/internal/createAccount";
import { verifyEmailCode } from "./controller/internal/verifyEmailCode";
import { resendEmailCode } from "./controller/internal/resendEmailCode";
import loginUser from "./controller/internal/login";
import { refreshAuthToken, verifyAuthToken } from "@repo/shared";
import logoutUser from "./controller/logout";
import { verifyUserAuth } from "./controller/verifyUserAuth";

const router: Router = express.Router();

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
