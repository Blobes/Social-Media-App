import express, { Router } from "express";
import { checkEmail } from "./check/controllers/email";
import { checkUsername } from "./check/controllers/username";
import { createAccount } from "./registration/controllers/createAccount";
import { verifyOtp } from "./otp/controllers/verifyOtp";
import { sendOtp } from "./otp/controllers/sendOtp";
import { loginUser } from "./session/controllers/login";
import { verifySession } from "./session/controllers/verifySession";
import { logoutUser } from "./session/controllers/logout";
import { setPrimaryDevice } from "./device/primaryDevice";
import { checkPhone } from "./check/controllers/phone";
import { refreshSession } from "./session/controllers/refreshSession";
import { getDevices } from "./device/getAllDevices";
import { removeDevice } from "./device/removeDevice";
import { authenticate, optionallyAuthenicate } from "@/envVars";
import { updateOnboarding } from "./registration/controllers/onboarding";
import { oauthExchange } from "./oauth/oauthExchange";
import { verifyTfaChallenge } from "./tfa-auth/verifyTFACode";
import { initiateTFAChallenge } from "./tfa-auth/initiateTFA";

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
router.post("/signup", createAccount);
router.post("/onboarding", authenticate, updateOnboarding);

// --- OAUTH ---
router.post("/oauth-exchange", oauthExchange);

// --- SESSION MANAGEMENT ---
router.post("/login", loginUser);
router.post("/refresh", refreshSession);
router.post("/logout", authenticate, logoutUser);
router.get("/verify-session", authenticate, verifySession);

// --- CODE VERIFICATION ---
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/initiate-tfa", optionallyAuthenicate, initiateTFAChallenge);
router.post("/verify-tfa-token", optionallyAuthenicate, verifyTfaChallenge);

// --- DEVICE MANAGEMENT ---
router.get("/devices", getDevices);
router.delete("/devices/:id", removeDevice);
router.patch("/devices/:id/primary", setPrimaryDevice);

export default router;
