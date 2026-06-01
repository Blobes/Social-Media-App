import { Response } from "express";
import { FlagPostData, IAuthRequest } from "../types";
import { executePostFlag } from "../services/post/executePostFlag";

interface FlagRequest extends IAuthRequest {
  body: FlagPostData;
}

export const flagPost = async (
  req: FlagRequest,
  res: Response,
): Promise<void> => {
  try {
    const reporterId = req.body.source === "USER" ? req.user?.id || null : null;

    const result = await executePostFlag(req.body, reporterId);

    if (result.status === "CONFLICT") {
      res.status(400).json({
        status: "ERROR",
        message: result.message,
      });
      return;
    }

    if (result.status === "NOT_FOUND") {
      res.status(404).json({
        status: "ERROR",
        message: result.message,
      });
      return;
    }

    res.status(result.message === "Report received." ? 201 : 200).json({
      status: "SUCCESS",
      message: result.message,
      source: req.body.source,
      logId: result.logId,
      escalated: result.escalated,
    });
  } catch (error: any) {
    console.error("Flaging Sync Error:", error);
    res.status(500).json({
      status: "ERROR",
      error: "Internal flagging synchronization error.",
    });
  }
};
