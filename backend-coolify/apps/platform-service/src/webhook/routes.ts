import express, { Router } from "express";
import { TrackResendEmail } from "./resend";

const router: Router = Router();

// api.funstakes.net/webhook
router.get("/", (req, res) => {
  res.json({ message: "Welcome to Funstakes Webhook API" });
});

// --- Group 4: Webhook Processors (Raw body processing for Svix signature validation) ---
router.post(
  "/track-resend",
  express.raw({ type: "application/json" }),
  TrackResendEmail,
);

export default router;
