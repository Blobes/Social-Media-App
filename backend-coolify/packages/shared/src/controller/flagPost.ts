import { Response, NextFunction } from "express";
import { FlagPostData, IAuthRequest } from "../types";
import { executePostFlag } from "../services/post/executePostFlag";
import { MESSAGES_REGISTRY } from "../constants/msgRegistry";
import { forwardError } from "../utils/misc/error";

interface FlagRequest extends IAuthRequest {
  body: FlagPostData;
}

export const flagPost = async (
  req: FlagRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const reporterId = req.body.source === "USER" ? req.user?.id || null : null;

    const result = await executePostFlag(req.body, reporterId);

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
      MESSAGES_REGISTRY.POST.POST_REPORT_RECEIVED.message;

    res.status(isSimpleReceipt ? 201 : 200).json({
      status: "SUCCESS",
      ...result.transInfo,
      source: req.body.source,
      logId: result.logId,
      escalated: result.escalated,
    });
  } catch (error: any) {
    console.error("Flaging Sync Error:", error);

    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.POST.POST_FLAGGING_SYNC_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.POST.POST_FLAGGING_SYNC_FALLBACK_ERROR,
      error,
    );
  }
};
