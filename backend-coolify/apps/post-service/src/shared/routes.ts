import express, { Router } from "express";
import { markPostAsSeen } from "./controllers/markAsSeen";
import { optionalAuth, verifyAuthToken } from "../envVars";
import { translateCaption } from "./controllers/translate";

const router: Router = express.Router();

router.patch("/:id/seen", optionalAuth, markPostAsSeen);
router.post("/translate/caption", verifyAuthToken, translateCaption);

export default router;
