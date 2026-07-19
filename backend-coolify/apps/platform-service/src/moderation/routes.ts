import { Router } from "express";
import { authenticate } from "@/envVars";
import { reportCase } from "./reportCase";
import { resolveCase } from "./resolveCase";
import { UserLogModel } from "@repo/database";
import { auditAction } from "@repo/security";

const router: Router = Router();

router.get(
  "/report-case",
  authenticate,
  auditAction({
    UserLogModel,
    action: "Reported Case",
    category: "MODERATION",
  }),
  reportCase,
);
router.get("/resolve-case", authenticate, resolveCase);

export default router;
