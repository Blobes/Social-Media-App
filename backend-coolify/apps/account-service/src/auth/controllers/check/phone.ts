import { UserModel } from "@repo/database";
import { Request, Response } from "express";

/**
 * Checks phone existence and evaluates hardware trust.
 */
export const checkPhone = async (req: Request, res: Response): Promise<any> => {
  const { phone } = req.body as { phone?: string };

  if (!phone) {
    return res.status(400).json({
      status: "ERROR",
      message: "Phone number is required",
      payload: null,
    });
  }

  // Ensure only numeric characters for lookup
  const normalizedPhone = phone.replace(/\D/g, "");

  try {
    const existingUser = await UserModel.findOne({
      phoneNumber: normalizedPhone,
    }).setOptions({ skipFilter: true });

    if (existingUser) {
      return res.status(200).json({
        status: "SUCCESS",
        message: !existingUser.isDeactivated
          ? "Phone number is already registered."
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

    return res.status(200).json({
      status: "SUCCESS",
      isExisting: false,
      message: "Phone number is available",
      payload: null,
    });
  } catch (error: any) {
    console.error("Check Phone Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Server error during phone check",
      payload: null,
    });
  }
};
