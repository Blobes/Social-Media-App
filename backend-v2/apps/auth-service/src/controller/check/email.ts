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
    // Check for an active user (Middleware handles exclusion of deleted)
    const activeUser = await UserModel.findOne({
      email: normalizedEmail,
    });

    if (activeUser) {
      return res.status(200).json({
        status: "SUCCESS",
        isCredentialAvailable: false,
        message: "Email is already registered.",
        payload: {
          accountStatus: "ACTIVE",
          _id: activeUser._id,
          username: activeUser.username,
        },
      });
    }

    // Check for deactivated account (Bypass middleware)
    // We check for the specific renaming pattern used during deactivation
    const deactivatedUser = await UserModel.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}_deleted_`, "i") },
    }).setOptions({ skipFilter: true });

    if (deactivatedUser) {
      return res.status(200).json({
        status: "SUCCESS",
        isCredentialAvailable: false,
        message: "This account is deactivated. Please restore it to continue.",
        payload: {
          accountStatus: "DEACTIVATED",
          _id: deactivatedUser._id,
          username: deactivatedUser.username,
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
