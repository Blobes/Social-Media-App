import { UserModel } from "@/models/user/user";
import bcrypt from "bcrypt";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";

// Update Password
interface PassWordRequest extends AuthRequest {
  body: {
    currentPassword: string;
    newPassword: string;
  };
}

export const changePassword = async (
  req: PassWordRequest,
  res: Response,
): Promise<any> => {
  // Relying strictly on the authenticated user ID
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized access",
      status: "ERROR",
      payload: null,
    });
  }

  // Basic Validation
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Current password and new password are required",
      status: "ERROR",
      payload: null,
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      message: "New password must be at least 6 characters long",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: "ERROR",
        payload: null,
      });
    }

    // Verify current password before allowing change
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "The current password you entered is incorrect",
        status: "ERROR",
        payload: null,
      });
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password cannot be the same as your current password",
        status: "ERROR",
        payload: null,
      });
    }

    // Hash and Save
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully",
      status: "SUCCESS",
      payload: null,
    });
  } catch (error: any) {
    console.error("Change Password Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to change password due to server error",
      status: "ERROR",
      payload: null,
    });
  }
};
