import { UserModel } from "@repo/database";
import { hashCode } from "@repo/shared";
import { Request, Response } from "express";

export const verifyEmailCode = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res
      .status(400)
      .json({ status: "ERROR", message: "Email and code are required." });
  }

  try {
    const formattedEmail = email.toLowerCase();

    /** * Look for a user where the provided email is either their current email
     * (signup flow) OR their pending email (change flow).
     */
    const user = await UserModel.findOne({
      $or: [{ email: formattedEmail }, { pendingEmail: formattedEmail }],
    });

    if (!user) {
      return res.status(404).json({
        status: "ERROR",
        message: "No verification request found for this email.",
      });
    }

    // --- SHARED VALIDATION LOGIC ---
    if (!user.verificationCode || !user.verificationExpiry) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "No verification process active." });
    }

    if (Date.now() > user.verificationExpiry.getTime()) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "Code expired." });
    }

    if (hashCode(code) !== user.verificationCode) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "Invalid verification code." });
    }

    // --- DETERMINISTIC UPDATE LOGIC ---
    // If the email matched 'pendingEmail', we perform the swap and cooldown
    const isChangingEmail = user.pendingEmail === formattedEmail;

    if (isChangingEmail) {
      user.email = user.pendingEmail as string;
      user.pendingEmail = null as any;
      user.lastEmailChangeAt = new Date(); // Start the 90-day cooldown
    }

    // Shared cleanup
    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationExpiry = undefined;
    user.lastEmailCodeSentAt = null as any;

    await user.save();

    return res.status(200).json({
      status: "SUCCESS",
      message: isChangingEmail
        ? "Your email has been successfully updated and verified."
        : "Email verified successfully.",
    });
  } catch (error: any) {
    console.error("Unified Verification Error:", error);
    return res
      .status(500)
      .json({ status: "ERROR", message: "Internal server error." });
  }
};
