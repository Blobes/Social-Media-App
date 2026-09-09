import { NextFunction, Request, Response } from "express";
import { forwardError, MESSAGES_REGISTRY } from "@repo/shared";
import {
  executeVerifySecurityQuestions,
  IAnswerPair,
} from "../services/verify";

interface VerifyQuestions extends Request {
  body: {
    identifier: string;
    answers: IAnswerPair[];
  };
}

/**
 * Controller endpoint managing verification of MFA security questions.
 */
export const verifySecurityQuestions = async (
  req: VerifyQuestions,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { identifier, answers } = req.body;

  try {
    const serviceResult = await executeVerifySecurityQuestions({
      identifier,
      answers,
    });

    if (
      serviceResult.status === "MISSING_INPUT" ||
      serviceResult.status === "INVALID_IDENTIFIER"
    ) {
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

    if (serviceResult.status === "INVALID_ANSWERS") {
      return res.status(401).json({
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
    console.error("Security Questions Verification Failed:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
