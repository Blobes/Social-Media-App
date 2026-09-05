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
import { authenticate, optionallyAuthenticate } from "@/envVars";
import { updateOnboarding } from "./registration/controllers/onboarding";
import { oauthExchange } from "./oauth/oauthExchange";
import { verifyTotpCode } from "./otp/totp/verify";
import { setupTotp } from "./otp/totp/setup";
import { autoInvalidateUserCache } from "@repo/shared";
import { turnstileVerification } from "./turnstile/controller";
import { commitAccountUpdate } from "./otp/messaging/controllers/commitUpdate";
import {
  enforcePolicy,
  requirePermission,
  devicePolicy,
  loadDeviceResource,
} from "@repo/security";
import { PERMISSIONS } from "@repo/database";
import { checkWhatsAppStatus } from "./whatsapp/checkStatus";

const router: Router = express.Router();

// Health check endpoint for auth service.
router.get("/", (_req, res) => {
  res.json({ message: "Welcome to Funstakes Auth API" });
});

// --- DISCOVERY & AVAILABILITY ---
router.post("/check/email", checkEmail);
router.post("/check/phone", checkPhone);
router.post("/check/username", checkUsername);

router.post("/signup", createAccount);

// --- ACCOUNT ONBOARDING ---
router.post(
  "/onboarding",
  authenticate,
  requirePermission(PERMISSIONS.USER.EDIT_PROFILE),
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

// --- CODE VERIFICATION & MFA ---
router.post("/otp/send-msg-code", sendChannelOtp);
router.post("/otp/verify-msg-code", verifyChannelOtp);
router.patch("/otp/update-account", commitAccountUpdate);
router.post("/otp/setup-totp", optionallyAuthenticate, setupTotp);
router.post("/otp/verify-totp", optionallyAuthenticate, verifyTotpCode);

router.post("/whatsapp-status", checkWhatsAppStatus);

// --- DEVICE MANAGEMENT ---
router.get(
  "/devices",
  authenticate,
  requirePermission(PERMISSIONS.DEVICE.READ),
  getDevices,
);
/**
 * Deletes a registered user device.
 * Requires DEVICE.DELETE permission + ReBAC ownership/admin check.
 */

router.delete(
  "/devices/:id",
  authenticate,
  requirePermission(PERMISSIONS.DEVICE.DELETE),
  enforcePolicy(devicePolicy, loadDeviceResource("id")),
  autoInvalidateUserCache("DEVICE_TRUST_UPDATE"),
  removeDevice,
);

/**
 * Marks a specific device as primary.
 * Requires DEVICE.SET_PRIMARY permission + ReBAC ownership/admin check.
 */
router.patch(
  "/devices/:id/primary",
  authenticate,
  requirePermission(PERMISSIONS.DEVICE.SET_PRIMARY),
  enforcePolicy(devicePolicy, loadDeviceResource("id")),
  autoInvalidateUserCache("DEVICE_TRUST_UPDATE"),
  setPrimaryDevice,
);

// --- BOT VERIFICATION ---
router.post("/verify-bot", authenticate, turnstileVerification);

export default router;
