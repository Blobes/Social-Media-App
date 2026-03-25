import { UserModel } from "@repo/database";
import { IAuthRequest, hashCode, invalidateCache } from "@repo/shared";
import { Response } from "express";

export const verifyPhoneUpdate = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const { code } = req.body;
  const userId = req.user?.id;

  try {
    // Retrieve user document and check for a pending update
    const user = await UserModel.findById(userId);

    if (!user || !user.pendingPhoneNumber) {
      return res.status(400).json({
        status: "ERROR",
        message: "No pending phone change request found.",
        payload: null,
      });
    }

    // Hash the incoming code and compare with the stored hash
    const isCodeValid = hashCode(code) === user.verificationCode;
    const isExpired = new Date() > user.verificationExpiry!;

    // Validate code integrity and expiration
    if (!isCodeValid || isExpired) {
      return res.status(400).json({
        status: "ERROR",
        message: isExpired
          ? "Verification code has expired."
          : "Invalid verification code.",
        payload: null,
      });
    }

    // Persist the verified phone number and clear temporary verification fields
    user.phoneNumber = user.pendingPhoneNumber;
    user.pendingPhoneNumber = null as any;
    user.verificationCode = null as any;
    user.lastPhoneChangeAt = new Date();

    await user.save();

    // Invalidate the profile cache to ensure the new phone number is reflected immediately
    await invalidateCache(`user:profile:${userId}`);

    return res.status(200).json({
      status: "SUCCESS",
      message: "Phone number verified and updated successfully.",
      payload: { phoneNumber: user.phoneNumber },
    });
  } catch (error: any) {
    // Log server-side errors and return generic failure response
    console.error("Verify Phone Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "An error occurred during verification.",
      payload: null,
    });
  }
};
