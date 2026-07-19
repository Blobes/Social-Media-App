import { NextFunction, Response } from "express";
import {
  executeTFAInitiation,
  forwardError,
  IAuthRequest,
  MESSAGES_REGISTRY,
  TFAPurpose,
} from "@repo/shared";

interface TFAInitiateRequest extends IAuthRequest {
  body: {
    purpose: TFAPurpose;
    identifier?: string;
  };
}

/**
 * Controller endpoint managing MFA workflows across activation and login challenge segments.
 */
export const initiateTFAChallenge = async (
  req: TFAInitiateRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { purpose, identifier } = req.body;
  const userId = req.user?.id;

  try {
    const serviceResult = await executeTFAInitiation({
      purpose,
      identifier,
      userId,
    });

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
    console.error("MFA Initiation Operational Fault:", error);

    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.AUTH.SERVER_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
