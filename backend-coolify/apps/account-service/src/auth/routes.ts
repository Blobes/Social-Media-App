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
import { autoInvalidateUserCache } from "@repo/shared";

const router: Router = express.Router();

// testing api.funstakes.net/auth
router.get("/", (req, res) => {
  res.json({ message: "Welcome to Funstakes Auth API" });
});

// --- DISCOVERY & AVAILABILITY ---
// Public read/check endpoints (No cache invalidation needed)
router.post("/check/email", checkEmail);
router.post("/check/phone", checkPhone);
router.post("/check/username", checkUsername);

// --- ACCOUNT ONBOARDING ---
router.post("/signup", createAccount);
router.post(
  "/onboarding",
  authenticate,
  autoInvalidateUserCache("ACCOUNT_UPDATE"),
  updateOnboarding,
);

// --- OAUTH ---
router.post(
  "/oauth-exchange",
  autoInvalidateUserCache("DEVICE_TRUST_UPDATE"),
  oauthExchange,
);

// --- SESSION MANAGEMENT ---
router.post(
  "/session/login",
  autoInvalidateUserCache("DEVICE_TRUST_UPDATE"),
  loginUser,
);
router.post("/session/refresh", refreshSession);
router.post(
  "/session/logout",
  authenticate,
  autoInvalidateUserCache("SESSIONS_REVOKE_ALL"),
  logoutUser,
);
router.get("/session/verify", authenticate, verifySession);

// --- CODE VERIFICATION ---
router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);
router.post("/tfa/initiate", optionallyAuthenicate, initiateTFAChallenge);
router.post("/tfa/verify-token", optionallyAuthenicate, verifyTfaChallenge);

// --- DEVICE MANAGEMENT ---
router.get("/devices", authenticate, getDevices);
router.delete(
  "/devices/:id",
  authenticate,
  autoInvalidateUserCache("DEVICE_TRUST_UPDATE"),
  removeDevice,
);
router.patch(
  "/devices/:id/primary",
  authenticate,
  autoInvalidateUserCache("DEVICE_TRUST_UPDATE"),
  setPrimaryDevice,
);

export default router;
