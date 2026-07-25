import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { executeResetInitiation } from "../services/initiateReset";

interface InitiateRequest extends IAuthRequest {
  body: {
    identifier: string;
  };
}

/**
 * Controller endpoint to handle user profile identifier email transformation procedures.
 */
export const initiatePasswordReset = async (
  req: InitiateRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { identifier } = req.body;

  try {
    const serviceResult = await executeResetInitiation({ identifier });

    if (serviceResult.status === "MISSING_IDENTIFIER") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "RESTRICTION") {
      return res.status(403).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Initiate Password Reset Instance Failure:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
