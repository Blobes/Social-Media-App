import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { executeIdDocSubmission } from "@/user/services/idDoc";

interface SubmitRequest extends IAuthRequest {
  body: {
    fullName: string;
    evidenceLinks?: string[];
    identityDocument: string;
    verificationSelfie: string;
  };
}

/**
 * Controller endpoint to ingest profile verification assets and lock progress trackers.
 */
export const submitIdDoc = async (
  req: SubmitRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const userId = req.user?.id;
  const { fullName, evidenceLinks, identityDocument, verificationSelfie } =
    req.body;

  if (!userId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  if (!identityDocument || !verificationSelfie || !fullName) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.VERIFICATION.NAME_ID_DOC_SELFIE_REQUIRED,
      payload: null,
    });
  }

  try {
    const serviceResult = await executeIdDocSubmission({
      userId,
      fullName,
      evidenceLinks,
      identityDocument,
      verificationSelfie,
    });

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "INELIGIBLE") {
      return res.status(403).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "ALREADY_PENDING") {
      return res.status(409).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(201).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Submit Verification Error:", error);
    return forwardError(
      next,
      error.message
        ? MESSAGES_REGISTRY.AUTH.SERVER_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
