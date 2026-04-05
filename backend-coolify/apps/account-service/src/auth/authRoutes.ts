import express, { Router } from "express";
import { checkEmail } from "./controllers/check/email";
import { checkUsername } from "./controllers/check/username";
import { createAccount } from "./controllers/createAccount";
import { verifyEmailCode } from "./controllers/otp/verifyEmailCode";
import { sendEmailCode } from "./controllers/otp/sendEmailCode";
import loginUser from "./controllers/session/login";
import { refreshAuthToken, verifyAuthToken } from "@repo/shared";
import { verifyUserAuth } from "./controllers/verifyUserAuth";
import { logoutUser } from "./controllers/session/logout";
import { getActiveSessions } from "./controllers/session/activeSessions";
import { setPrimaryDevice } from "./controllers/session/primaryDevice";

const router: Router = express.Router();

// --- DISCOVERY & AVAILABILITY ---
// Public endpoints used during registration to check if data is unique
router.post("/check-email", checkEmail);
router.post("/check-username", checkUsername);

// --- ACCOUNT ONBOARDING ---
router.post("/register", createAccount);
router.put("/verify-email-code", verifyEmailCode);
router.post("/resend-email-code", sendEmailCode);

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
