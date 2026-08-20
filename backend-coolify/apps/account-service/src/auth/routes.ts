import express, { Router } from "express";
import { checkEmail } from "./check/controllers/email";
import { checkUsername } from "./check/controllers/username";
import { createAccount } from "./registration/controllers/createAccount";
import { verifyChannelOtp } from "./otp/messaging/controllers/verifyOtp";
import { sendChannelOtp } from "./otp/messaging/controllers/sendOtp";
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
import { verifyTotpCode } from "./otp/totp/verify";
import { setupTotp } from "./otp/totp/setup";
import { autoInvalidateUserCache } from "@repo/shared";
import { turnstileVerification } from "./turnstile/controller";
import { commitAccountUpdate } from "./otp/messaging/controllers/commitUpdate";

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
router.post("/otp/send-msg-code", sendChannelOtp);
router.post("/otp/verify-msg-code", verifyChannelOtp);
router.patch("/otp/update-account", commitAccountUpdate);
router.post("/otp/setup-totp", optionallyAuthenicate, setupTotp);
router.post("/otp/verify-totp", optionallyAuthenicate, verifyTotpCode);

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

// --- BOT VERIFICATION ---
router.post("/verify-bot", authenticate, turnstileVerification);

export default router;
