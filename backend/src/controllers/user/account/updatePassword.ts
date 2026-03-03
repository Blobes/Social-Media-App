import mongoose from "mongoose";
import { UserModel } from "@/models/user/user";
import bcrypt from "bcrypt";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";

// Update Password
interface PassWordRequest extends AuthRequest {
  body: {
    newPassword: string;
  };
}
export const updateUserPassword = async (
  req: PassWordRequest,
  res: Response,
): Promise<any> => {
  const targetUserId = req.params.id;
  const { id: currUserId, isAdmin } = req.user || {};
  const { newPassword } = req.body;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      message: "Invalid user ID format",
      status: "ERROR",
      payload: null,
    });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters long",
      status: "ERROR",
      payload: null,
    });
  }

  if (currUserId !== targetUserId && !isAdmin) {
    return res.status(403).json({
      message: "You can't change another user's password",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    const user = await UserModel.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: "ERROR",
        payload: null,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await UserModel.findByIdAndUpdate(targetUserId, {
      password: hashedPassword,
    });

    return res.status(200).json({
      message: "Password changed successfully",
      status: "SUCCESS",
      payload: null,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to change password due to server error",
      status: "ERROR",
      payload: null,
    });
  }
};
