import { UserModel } from "@repo/database";
import { dispatchEmailCode, genVerificationCode, hashCode } from "@repo/shared";
import { Request, Response } from "express";

export const sendEmailCode = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const { email } = req.body;

  // 1. Guard Clause: Validation
  if (!email) {
    return res.status(400).json({
      status: "ERROR",
      message: "Email is required.",
      payload: null,
    });
  }

  try {
    // 2. Find the user
    const user = await UserModel.findOne({ email });

    if (!user) {
      // Security Tip: Some experts return 200 even if user not found
      // to prevent email enumeration, but 404 is standard for internal apps.
      return res.status(404).json({
        status: "ERROR",
        message: "User with this email does not exist.",
        payload: null,
      });
    }

    // 3. Check if already verified
    if (!user.pendingEmail && user.isEmailVerified) {
      return res.status(400).json({
        status: "ERROR",
        message: "This email is already verified.",
        payload: null,
      });
    }

    // --- START RATE LIMITING CHECK ---
    const COOLDOWN_SECONDS = 60;
    const now = new Date();
    if (user.lastEmailCodeSentAt) {
      const timePassed =
        (now.getTime() - user.lastEmailCodeSentAt.getTime()) / 1000;

      if (timePassed < COOLDOWN_SECONDS) {
        const waitTime = Math.ceil(COOLDOWN_SECONDS - timePassed);
        return res.status(429).json({
          // 429 is "Too Many Requests"
          status: "ERROR",
          message: `Please wait ${waitTime} seconds before requesting a new code.`,
        });
      }
    }
    // --- END RATE LIMITING CHECK ---

    // 5. Generate New Code
    const newCode = genVerificationCode();

    // 6. Update User Document
    user.verificationCode = hashCode(newCode);
    user.verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    // 7. Dispatch Email using our dispatchEmailCode service with Resend/SMTP fallback
    try {
      await dispatchEmailCode({ to: email, code: newCode });
    } catch (emailError) {
      console.error("User saved but email failed:", emailError);
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "A new verification code has been sent to your email.",
      payload: null,
    });
  } catch (error: any) {
    console.error("Resend Code Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Failed to resend verification code.",
      payload: null,
    });
  }
};
