import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import {
  executeSetupSecurityQuestions,
  ISecurityQuestionInput,
} from "../services/setup";

interface SetupQuestions extends IAuthRequest {
  body: {
    questions: ISecurityQuestionInput[];
  };
}

/**
 * Controller managing setup of user security questions for MFA.
 */
export const setupSecurityQuestions = async (
  req: SetupQuestions,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { questions } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const serviceResult = await executeSetupSecurityQuestions({
      userId,
      questions,
    });

    if (serviceResult.status === "INVALID_INPUT") {
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

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Security Questions Setup Failed:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
