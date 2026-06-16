import express, { Router } from "express";
import { markPostAsSeen } from "./markAsSeen";
import { optionalAuth, verifyAuthToken } from "../envVars";
import { translateCaption } from "./translate";

const router: Router = express.Router();

router.patch("/:id/seen", optionalAuth, markPostAsSeen);
router.post("/translate/caption", verifyAuthToken, translateCaption);

export default router;
