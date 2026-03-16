import { IdVerificationRequestModel, UserModel } from "@repo/database";
import { AuthRequest } from "@repo/shared";
import { Response } from "express";

interface SubmitRequest extends AuthRequest {
  body: {
    fullName: string;
    evidenceLinks?: string[];
    identityDocument: string; // ObjectId of the uploaded ID Media
    verificationSelfie: string; // ObjectId of the uploaded Selfie Media
  };
}

export const submitVerification = async (
  req: SubmitRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;
  const { fullName, evidenceLinks, identityDocument, verificationSelfie } =
    req.body;

  if (!userId) {
    return res
      .status(401)
      .json({ status: "ERROR", message: "Unauthorized access." });
  }

  // Basic validation for required Media IDs
  if (!identityDocument || !verificationSelfie || !fullName) {
    return res.status(400).json({
      status: "ERROR",
      message: "Full name, ID document, and verification selfie are required.",
    });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "ERROR", message: "User not found." });
    }

    // 1. Check eligibility (Merit from background worker OR Notable from signup)
    if (!user.meritsVerification && !user.isNotable) {
      return res.status(403).json({
        status: "ERROR",
        message: "You are not yet eligible to apply for verification.",
      });
    }

    // 2. Prevent duplicate active applications
    if (user.idVerificationStatus === "PENDING") {
      return res.status(409).json({
        status: "ERROR",
        message: "You already have a pending verification request.",
      });
    }

    // 3. Create the specialized request document
    const verificationRequest = await IdVerificationRequestModel.create({
      userId,
      fullName,
      evidenceLinks: evidenceLinks || [],
      identityDocument,
      verificationSelfie,
      status: "PENDING",
    });

    // 4. Update the User Model state
    user.idVerificationStatus = "PENDING";
    user.idVerificationStatus = verificationRequest._id as any;
    await user.save();

    return res.status(201).json({
      status: "SUCCESS",
      message:
        "Verification request submitted. Our team will review your documents.",
      payload: {
        requestId: verificationRequest._id,
        status: "PENDING",
      },
    });
  } catch (error: any) {
    console.error("Submit Verification Error:", error);
    return res
      .status(500)
      .json({ status: "ERROR", message: "Internal server error." });
  }
};
