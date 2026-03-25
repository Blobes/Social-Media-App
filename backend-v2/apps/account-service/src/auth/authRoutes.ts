import express, { Router } from "express";
import { checkEmail } from "./controller/check/email";
import { checkUsername } from "./controller/check/username";
import { createAccount } from "./controller/new-account/createAccount";
import { verifyEmailCode } from "./controller/new-account/verifyEmailCode";
import { resendEmailCode } from "./controller/new-account/resendEmailCode";
import loginUser from "./controller/session/login";
import { refreshAuthToken, verifyAuthToken } from "@repo/shared";
import { verifyUserAuth } from "./controller/verifyUserAuth";
import { logoutUser } from "./controller/session/logout";
import { getActiveSessions } from "./controller/session/activeSessions";
import { setPrimaryDevice } from "./controller/session/primaryDevice";

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
router.get("/sessions", getActiveSessions);
router.patch("/sessions/primary", setPrimaryDevice);

// --- IDENTITY VERIFICATION ---
// Used by the client to sync the current user state on app load
router.get("/verify-auth", verifyAuthToken, verifyUserAuth);

export default router;
