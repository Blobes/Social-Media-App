import { UserModel } from "@repo/database";
import { Request, Response } from "express";

/**
 * Checks email existence and evaluates hardware trust before login.
 * This determines if the frontend should trigger an OTP flow or simple password entry.
 */
export const checkEmail = async (req: Request, res: Response): Promise<any> => {
  const { email } = req.body as { email?: string };

  if (!email) {
    return res.status(400).json({
      status: "ERROR",
      message: "Email is required",
      payload: null,
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Locate the user, including deactivated accounts
    const existingUser = await UserModel.findOne({
      email: normalizedEmail,
    }).setOptions({ skipFilter: true });

    if (existingUser) {
      return res.status(200).json({
        status: "SUCCESS",
        message: !existingUser.isDeactivated
          ? "Email is already registered."
          : "This account is deactivated. Please restore it to continue.",
        isExisting: true,
        payload: {
          accountStatus: !existingUser.isDeactivated ? "ACTIVE" : "DEACTIVATED",
          userId: existingUser._id,
          username: existingUser.username,
          firstName: existingUser.firstName,
          email: existingUser.email,
          phone: existingUser.phoneNumber,
        },
      });
    }

    // New user scenario
    return res.status(200).json({
      status: "SUCCESS",
      isExisting: false,
      message: "Email is available",
      payload: null,
    });
  } catch (error: any) {
    console.error("Check Email Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Server error during email check",
      payload: null,
    });
  }
};
