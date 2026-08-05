import { IdVerificationRequestModel } from "@repo/database";
import { IAuthRequest, fetchSingleUser } from "@repo/shared";
import { Response } from "express";

interface ReviewRequest extends IAuthRequest {
  body: {
    requestId: string;
    decision: "APPROVED" | "REJECTED";
    rejectionReason?: string;
  };
}

/**
 * Reviews ID verification requests, updates request decision status, and synchronizes user verification flags.
 */
export const reviewVerification = async (
  req: ReviewRequest,
  res: Response,
): Promise<Response> => {
  const { requestId, decision } = req.body;

  try {
    const request = await IdVerificationRequestModel.findById(requestId);
    if (!request) {
      return res
        .status(404)
        .json({ status: "ERROR", message: "Request not found." });
    }

    request.status = decision;
    await request.save();

    const isApproved = decision === "APPROVED";

    const user = await fetchSingleUser({
      identifier: request.userId,
      flags: { lean: false, skipFilter: true },
    });

    if (user) {
      user.idVerificationStatus = decision;
      user.isVerified = isApproved;
      user.isPublicFigure = isApproved;
      await user.save();
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: `User verification has been ${decision.toLowerCase()}.`,
    });
  } catch (error: unknown) {
    console.error("Review Verification Error:", error);
    return res
      .status(500)
      .json({ status: "ERROR", message: "Failed to process review." });
  }
};
