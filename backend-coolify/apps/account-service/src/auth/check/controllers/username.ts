import { CheckPurpose, executeAccountCheck } from "@/auth/check/service";
import { NextFunction, Request, Response } from "express";
import { forwardError, MESSAGES_REGISTRY } from "@repo/shared";

/**
 * Controller endpoint to evaluate username parameters for registration availability or active login flags.
 */
export const checkUsername = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { username, purpose } = req.body as {
    username?: string;
    purpose?: CheckPurpose;
  };

  try {
    const serviceResult = await executeAccountCheck({
      identifierType: "USERNAME",
      identifier: username || "",
      purpose,
    });

    if (serviceResult.status === "MISSING_IDENTIFIER") {
      return res.status(400).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.USERNAME_REQUIRED,
        payload: null,
      });
    }

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.USERNAME_NOT_FOUND,
        payload: null,
      });
    }

    if (serviceResult.status === "THIRD_PARTY_RESTRICTION") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        isExisting: serviceResult.isExisting,
        signedUpWith: serviceResult.signedUpWith,
        payload: serviceResult.payload,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      isExisting: serviceResult.isExisting,
      signedUpWith: serviceResult.signedUpWith,
      suggestions: serviceResult.suggestions,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("[checkUsername] Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
