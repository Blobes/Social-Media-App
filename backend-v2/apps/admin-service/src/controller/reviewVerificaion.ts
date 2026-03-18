import { IdVerificationRequestModel, UserModel } from "@repo/database";
import { IAuthRequest } from "@repo/shared";

import { Response } from "express";

interface ReviewRequest extends IAuthRequest {
  body: {
    requestId: string;
    decision: "APPROVED" | "REJECTED";
    rejectionReason?: string; // Optional feedback for the user
  };
}

export const reviewVerification = async (
  req: ReviewRequest,
  res: Response,
): Promise<any> => {
  const { requestId, decision, rejectionReason } = req.body;

  try {
    // 1. Find and update the request
    const request = await IdVerificationRequestModel.findById(requestId);
    if (!request) {
      return res
        .status(404)
        .json({ status: "ERROR", message: "Request not found." });
    }

    request.status = decision;
    await request.save();

    // 2. Update the User profile based on the decision
    const isApproved = decision === "APPROVED";

    await UserModel.findByIdAndUpdate(request.userId, {
      $set: {
        idVerificationStatus: decision,
        isVerified: isApproved, // General badge
        isPublicFigure: isApproved, // Merit-based figure badge
      },
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: `User verification has been ${decision.toLowerCase()}.`,
    });
  } catch (error: any) {
    console.error("Review Verification Error:", error);
    return res
      .status(500)
      .json({ status: "ERROR", message: "Failed to process review." });
  }
};
