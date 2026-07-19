import { Router } from "express";
import { authenticate } from "@/envVars";
import { getErrorLogDetails } from "./controllers/errorLogDetail";
import { getErrorLogs } from "./controllers/getErrorLogs";
import { getUserLogs } from "./controllers/getUserLogs";
import { purgeErrorLogs } from "./controllers/purgeErrorLogs";

const router: Router = Router();

router.get("/error-detail", authenticate, getErrorLogDetails);
router.get("/error-logs", authenticate, getErrorLogs);
router.get("/user-logs", authenticate, getUserLogs);
router.delete("/purge-error-logs", authenticate, purgeErrorLogs);

export default router;
