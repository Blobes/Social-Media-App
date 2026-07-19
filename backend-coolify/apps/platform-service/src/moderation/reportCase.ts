import { Response, NextFunction } from "express";
import {
  IAuthRequest,
  IExecuteReportInput,
  MESSAGES_REGISTRY,
  executeCaseReport,
  forwardError,
} from "@repo/shared";

interface FlagRequest extends IAuthRequest {
  body: IExecuteReportInput;
}

/**
 * Controller endpoint to process system ingestion alerts or incoming user community report filings.
 */
export const reportCase = async (
  req: FlagRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const reporterId = req.body.source === "USER" ? req.user?.id || null : null;

    const result = await executeCaseReport(req.body, reporterId);

    if (result.status === "CONFLICT") {
      res.status(400).json({
        status: "ERROR",
        ...result.transInfo,
        payload: null,
      });
      return;
    }

    if (result.status === "NOT_FOUND") {
      res.status(404).json({
        status: "ERROR",
        ...result.transInfo,
        payload: null,
      });
      return;
    }

    const isSimpleReceipt =
      result.transInfo.message ===
      MESSAGES_REGISTRY.ADMIN.MODERATION_REPORT_RECEIVED.message;

    res.status(isSimpleReceipt ? 201 : 200).json({
      status: "SUCCESS",
      ...result.transInfo,
      source: req.body.source,
      logId: result.logId,
      escalated: result.escalated,
    });
  } catch (error: any) {
    console.error("Content Flagging Operational Fault:", error);

    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.ADMIN.MODERATION_FLAGGING_SYNC_THROWN_ERROR(
            error.message,
          )
        : MESSAGES_REGISTRY.ADMIN.MODERATION_FLAGGING_SYNC_FALLBACK_ERROR,
      error,
    );
  }
};
