import { UserModel } from "@repo/database";
import { Request, Response } from "express";

export const checkPhone = async (req: Request, res: Response): Promise<any> => {
  const { phone } = req.body as { phone?: string };

  if (!phone) {
    return res.status(400).json({
      status: "ERROR",
      message: "Phone number is required",
      payload: null,
    });
  }

  // Remove any non-numeric characters if you store plain numbers
  // Or just trim if you store them as formatted strings
  const normalizedPhone = phone.replace(/\D/g, "");

  try {
    // Check for an existing user (including deactivated ones)
    const existingUser = await UserModel.findOne({
      phone: normalizedPhone,
    }).setOptions({ skipFilter: true });

    if (existingUser) {
      return res.status(200).json({
        status: "SUCCESS",
        isExisting: true,
        message: !existingUser.isDeactivated
          ? "Phone number is already registered."
          : "This account is deactivated. Please restore it to continue.",
        payload: {
          accountStatus: !existingUser.isDeactivated ? "ACTIVE" : "DEACTIVATED",
          _id: existingUser._id,
          username: existingUser.username,
        },
      });
    }

    // Phone is available
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
