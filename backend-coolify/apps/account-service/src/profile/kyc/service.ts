import mongoose from "mongoose";
import { KycRequestModel } from "@repo/database";
import { TransInfo, MESSAGES_REGISTRY, fetchSingleUser } from "@repo/shared";

interface ISubmitIdDocInput {
  userId: string;
  fullName: string;
  evidenceLinks?: string[];
  identityDocument: string;
  verificationSelfie: string;
}

interface ISubmitIdDocResult {
  status: "SUCCESS" | "NOT_FOUND" | "INELIGIBLE" | "ALREADY_PENDING";
  transInfo: TransInfo;
  payload?: {
    requestId: mongoose.Types.ObjectId;
    status: string;
  };
}

/**
 * Validates candidate profile parameters, blocks duplicate pipelines, and registers document records.
 */
export const executeKycSubmission = async (
  input: ISubmitIdDocInput,
): Promise<ISubmitIdDocResult> => {
  const {
    userId,
    fullName,
    evidenceLinks,
    identityDocument,
    verificationSelfie,
  } = input;

  const user = await fetchSingleUser({
    identifier: userId,
    flags: { lean: false, skipFilter: false },
  });

  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  // Verify background worker profiling metrics or registration flags
  if (!user.meritsVerification && !user.isNotable) {
    return {
      status: "INELIGIBLE",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.INELIGIBLE,
    };
  }

  // Block simultaneous tracking pipelines
  if (user.kycReviewStatus === "PENDING") {
    return {
      status: "ALREADY_PENDING",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.ALREADY_PENDING,
    };
  }

  // Build the underlying storage ledger entries
  const verificationRequest = await KycRequestModel.create({
    userId,
    fullName,
    evidenceLinks: evidenceLinks || [],
    identityDocument,
    verificationSelfie,
    status: "PENDING",
  });

  // Persist current tracking states into user profile fields
  user.kycReviewStatus = "PENDING";
  await user.save();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.VERIFICATION.REQUEST_SUBMITTED_SUCCESSFULLY,
    payload: {
      requestId: verificationRequest._id as mongoose.Types.ObjectId,
      status: "PENDING",
    },
  };
};
