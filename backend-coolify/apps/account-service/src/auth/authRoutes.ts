import express, { Router } from "express";
import { checkEmail } from "./controllers/check/email";
import { checkUsername } from "./controllers/check/username";
import { createAccount } from "./controllers/new-account/createAccount";
import { verifyOtp } from "./controllers/otp/verifyOtp";
import { sendOtp } from "./controllers/otp/sendOtp";
import loginUser from "./controllers/session/login";
import { verifyAuthToken } from "@repo/shared";
import { verifySession } from "./controllers/session/verifySession";
import { logoutUser } from "./controllers/session/logout";
import { getActiveSessions } from "./controllers/session/activeSessions";
import { setPrimarySession } from "./controllers/session/primarySession";
import { checkPhone } from "./controllers/check/phone";
import { refreshSession } from "./controllers/session/refreshSession";

const router: Router = express.Router();

// testing api.funstakes.net/auth
router.get("/", (req, res) => {
  res.json({ message: "Welcome to Funstakes Auth API" });
});

// --- DISCOVERY & AVAILABILITY ---
// Public endpoints used during registration to check if data is unique
router.post("/check-email", checkEmail);
router.post("/check-phone", checkPhone);
router.post("/check-username", checkUsername);

// --- ACCOUNT ONBOARDING ---
router.post("/register", createAccount);
router.put("/verify-otp", verifyOtp);
router.post("/send-otp", sendOtp);

// --- SESSION MANAGEMENT ---
router.post("/login", loginUser);
router.post("/refresh", refreshSession);
router.post("/logout", verifyAuthToken, logoutUser);
router.get("/sessions", getActiveSessions);
router.patch("/session/set-primary", setPrimarySession);

// --- IDENTITY VERIFICATION ---
// Used by the client to sync the current user state on app load
router.get("/verify-session", verifyAuthToken, verifySession);

export default router;
