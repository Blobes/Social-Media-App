import { CheckPurpose, executeAccountCheck } from "@/auth/check/service";
import { NextFunction, Request, Response } from "express";
import { forwardError, MESSAGES_REGISTRY } from "@repo/shared";

/**
 * Checks phone existence and evaluates hardware trust.
 */
export const checkPhone = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const { phone, purpose = "LOGIN" } = req.body as {
    phone?: string;
    purpose?: CheckPurpose;
  };

  try {
    const serviceResult = await executeAccountCheck({
      identifierType: "PHONE_NUMBER",
      identifier: phone || "",
      purpose,
    });

    if (serviceResult.status === "MISSING_IDENTIFIER") {
      return res.status(400).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.PHONE_REQUIRED,
        payload: null,
      });
    }

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.PHONE_NOT_FOUND,
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
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Check Phone Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
