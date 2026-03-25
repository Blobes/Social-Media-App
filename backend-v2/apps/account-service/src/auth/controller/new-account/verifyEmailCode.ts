import { UserModel } from "@repo/database";
import { hashCode, invalidatePattern } from "@repo/shared";
import { Request, Response } from "express";

export const verifyEmailCode = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const { email, code } = req.body;

  // Validate presence of required inputs
  if (!email || !code) {
    return res
      .status(400)
      .json({ status: "ERROR", message: "Email and code are required." });
  }

  try {
    const formattedEmail = email.toLowerCase();

    // Query for user where the email is either current or pending
    const user = await UserModel.findOne({
      $or: [{ email: formattedEmail }, { pendingEmail: formattedEmail }],
    });

    if (!user) {
      return res.status(404).json({
        status: "ERROR",
        message: "No verification request found for this email.",
      });
    }

    // Verify verification process state
    if (!user.verificationCode || !user.verificationExpiry) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "No verification process active." });
    }

    // Validate code expiration
    if (Date.now() > user.verificationExpiry.getTime()) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "Code expired." });
    }

    // Compare hashed code for security integrity
    if (hashCode(code) !== user.verificationCode) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "Invalid verification code." });
    }

    // Detect if this is an email change flow or initial signup verification
    const isChangingEmail = user.pendingEmail === formattedEmail;

    if (isChangingEmail) {
      // Finalize the email swap and update cooldown timestamp
      user.email = user.pendingEmail as string;
      user.pendingEmail = null as any;
      user.lastEmailChangeAt = new Date();
    }

    // Standardize verification flags and cleanup temporary codes
    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationExpiry = undefined;
    user.lastEmailCodeSentAt = null as any;

    // Persist changes to MongoDB
    await user.save();

    // Perform pattern-based invalidation to clear all cached instances of the user
    // This wipes profile, session, and list data across the platform
    await invalidatePattern(`user:*:${user._id}*`);

    return res.status(200).json({
      status: "SUCCESS",
      message: isChangingEmail
        ? "Your email has been successfully updated and verified."
        : "Email verified successfully.",
    });
  } catch (error: any) {
    // Log internal error and return failure response
    console.error("Unified Verification Error:", error);
    return res
      .status(500)
      .json({ status: "ERROR", message: "Internal server error." });
  }
};

export default verifyEmailCode;
