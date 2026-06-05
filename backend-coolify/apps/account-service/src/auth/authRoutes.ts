import express, { Router } from "express";
import { checkEmail } from "./controllers/check/email";
import { checkUsername } from "./controllers/check/username";
import { createAccount } from "./controllers/new-account/createAccount";
import { verifyOtp } from "./controllers/otp/verifyOtp";
import { sendOtp } from "./controllers/otp/sendOtp";
import { loginUser } from "./controllers/session/login";
import { verifySession } from "./controllers/session/verifySession";
import { logoutUser } from "./controllers/session/logout";
import { setPrimaryDevice } from "./controllers/device/primaryDevice";
import { checkPhone } from "./controllers/check/phone";
import { refreshSession } from "./controllers/session/refreshSession";
import { getDevices } from "./controllers/device/getAllDevices";
import { removeDevice } from "./controllers/device/removeDevice";
import { verifyAuthToken } from "@/envVars";
import { updateOnboarding } from "./controllers/new-account/updateOnboarding";

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
router.post("/onboarding", verifyAuthToken, updateOnboarding);

// --- SESSION MANAGEMENT ---
router.post("/login", loginUser);
router.post("/refresh", refreshSession);
router.post("/logout", verifyAuthToken, logoutUser);
router.get("/verify-session", verifyAuthToken, verifySession);

// --- IDENTITY VERIFICATION ---
// Used by the client to sync the current user state on app load
router.put("/verify-otp", verifyOtp);
router.post("/send-otp", sendOtp);

// --- DEVICE MANAGEMENT ---
router.get("/devices", getDevices);
router.delete("/devices/:id", removeDevice);
router.patch("/devices/:id/primary", setPrimaryDevice);

export default router;
