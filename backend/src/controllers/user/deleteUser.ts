import mongoose from "mongoose";
import { UserModel } from "@/models";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";

export const deleteUser = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  const userId = req.params.id;
  const currUserId = req.user?.id;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      message: "Invalid user ID format",
      status: "ERROR",
      payload: null,
    });
  }

  if (!currUserId) {
    return res.status(401).json({
      message: "Unauthorized",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    // Fetch both the target user and current user (for admin check)
    const [targetUser, currentUser] = await Promise.all([
      UserModel.findById(userId),
      UserModel.findById(currUserId),
    ]);

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found",
        status: "ERROR",
        payload: null,
      });
    }

    if (!currentUser) {
      res.status(401).json({
        message: "Current user not found",
        status: "ERROR",
        payload: null,
      });
      return;
    }

    // Only allow self-deletion or admins
    if (currUserId !== userId && !currentUser.isAdmin) {
      return res.status(403).json({
        message: "You don't have permission to delete this account",
        status: "ERROR",
        payload: null,
      });
    }

    await UserModel.findByIdAndDelete(userId);

    res.status(200).json({
      message: "User deleted successfully",
      status: "SUCCESS",
      payload: null,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to delete account due to server error",
      payload: null,
      status: "ERROR",
    });
  }
};
