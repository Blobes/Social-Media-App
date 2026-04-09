import { UserModel } from "@repo/database";
import { Request, Response } from "express";

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
    // Check for an existing user (including deactivated ones)
    const existingUser = await UserModel.findOne({
      email: normalizedEmail,
    }).setOptions({ skipFilter: true });

    if (existingUser) {
      return res.status(200).json({
        status: "SUCCESS",
        isCredentialAvailable: false,
        message: !existingUser.isDeactivated
          ? "Email is already registered."
          : "This account is deactivated. Please restore it to continue.",
        payload: {
          accountStatus: !existingUser.isDeactivated ? "ACTIVE" : "DEACTIVATED",
          _id: existingUser._id,
          username: existingUser.username,
        },
      });
    }

    // Email is truly available
    return res.status(200).json({
      status: "SUCCESS",
      isCredentialAvailable: true,
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
