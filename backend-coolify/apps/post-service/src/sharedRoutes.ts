import { optVerifyToken } from "@repo/shared";
import express, { Router } from "express";
import { markPostAsSeen } from "./feed/controllers/markAsSeen";

const router: Router = express.Router();

router.patch("/:id/seen", optVerifyToken, markPostAsSeen);

export default router;
