import express, { Router } from "express";
import { markPostAsSeen } from "./markAsSeen";
import { optionalAuth } from "../envVars";

const router: Router = express.Router();

router.patch("/:id/seen", optionalAuth, markPostAsSeen);

export default router;
