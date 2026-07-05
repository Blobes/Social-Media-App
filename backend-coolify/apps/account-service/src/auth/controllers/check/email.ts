import { Request, Response, NextFunction } from "express";
import { executeAccountCheck } from "@/auth/services/accountChecker";
import { forwardError, MESSAGES_REGISTRY } from "@repo/shared";

/**
 * Controller endpoint to handle verification requests for account email availability.
 */
export const checkEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { email, purpose = "LOGIN" } = req.body as {
    email?: string;
    purpose?: "REGISTRATION" | "LOGIN";
  };

  try {
    const serviceResult = await executeAccountCheck({
      type: "EMAIL",
      identifier: email || "",
      purpose,
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

    if (serviceResult.status === "THIRD_PARTY_RESTRICTION") {
      return res.status(403).json({
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
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Check Email Error:", error);

    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.AUTH.SERVER_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
    // return res.status(500).json({
    //   status: "ERROR",
    //   ...(error.message
    //     ? MESSAGES_REGISTRY.AUTH.SERVER_THROWN_ERROR(error.message)
    //     : MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR),
    //   payload: null,
    // });
  }
};
