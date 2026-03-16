// src/types/express.d.ts
import { Severity } from "../config/policy.config";

declare global {
  namespace Express {
    interface Request {
      moderation?: {
        topics: string[];
        severity?: Severity | null;
        needsReview: boolean;
        ruleViolated?: string | null;
        isUnsure?: boolean;
        reason?: string | null;
      };
    }
  }
}
