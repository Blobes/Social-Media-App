import { UserModel } from "@repo/database";
import { IAuthRequest, hashCode } from "@repo/shared";
import { Response } from "express";

export const verifyPhoneUpdate = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const { code } = req.body;
  const userId = req.user?.id;

  try {
    const user = await UserModel.findById(userId);

    if (!user || !user.pendingPhoneNumber) {
      return res.status(400).json({
        status: "ERROR",
        message: "No pending phone change request found.",
        payload: null,
      });
    }

    // Verify code and check expiry
    const isCodeValid = hashCode(code) === user.verificationCode;
    const isExpired = new Date() > user.verificationExpiry!;

    if (!isCodeValid || isExpired) {
      return res.status(400).json({
        status: "ERROR",
        message: isExpired
          ? "Verification code has expired."
          : "Invalid verification code.",
        payload: null,
      });
    }

    // Commit the change
    user.phoneNumber = user.pendingPhoneNumber;
    user.pendingPhoneNumber = null as any;
    user.verificationCode = null as any;
    user.lastPhoneChangeAt = new Date();

    await user.save();

    return res.status(200).json({
      status: "SUCCESS",
      message: "Phone number verified and updated successfully.",
      payload: { phoneNumber: user.phoneNumber },
    });
  } catch (error: any) {
    console.error("Verify Phone Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "An error occurred during verification.",
      payload: null,
    });
  }
};
