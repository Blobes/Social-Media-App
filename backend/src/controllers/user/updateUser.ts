import mongoose from "mongoose";
import { UserModel } from "@/models";
import bcrypt from "bcrypt";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";

// Update User Info
interface UserInfoRequest extends AuthRequest {
  body: {
    firstName: string;
    lastName: string;
    profileImage: string;
    coverImage: string;
    about: string;
    gender: string;
    dateOfBirth: string;
    interests: string[];
    location: string;
    occupation: string;
    relationship: string;
  };
}
export const updateUserInfo = async (
  req: UserInfoRequest,
  res: Response
): Promise<any> => {
  const targetUserId = req.params.id;
  const { id: currUserId, isAdmin } = req.user || {};

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      message: "Invalid user ID format",
      status: "ERROR",
      payload: null,
    });
  }

  const {
    firstName,
    lastName,
    profileImage,
    coverImage,
    about,
    location,
    occupation,
    relationship,
  } = req.body;

  try {
    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        message: "User not found",
        status: "ERROR",
        payload: null,
      });
    }

    if (currUserId !== targetUserId && !isAdmin) {
      return res.status(403).json({
        message: "You can't edit another user's information",
        status: "ERROR",
        payload: null,
      });
    }

    const allowedUpdates = {
      firstName,
      lastName,
      profileImage,
      coverImage,
      about,
      location,
      occupation,
      relationship,
    };

    const updatedUser = await UserModel.findByIdAndUpdate(
      targetUserId,
      allowedUpdates,
      { new: true }
    );

    const { password, ...userDetails } = updatedUser?.toObject() || {};

    return res.status(200).json({
      message: "User details updated successfully",
      status: "SUCCESS",
      payload: userDetails,
    });
  } catch (error: any) {
    return res.status(500).json({
      message:
        error.message || "Failed to update user info due to server error",
      status: "ERROR",
      payload: null,
    });
  }
};

// Update Password
interface PassWordRequest extends AuthRequest {
  body: {
    newPassword: string;
  };
}
export const updateUserPassword = async (
  req: PassWordRequest,
  res: Response
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

// Update Email
interface UserEmailRequest extends AuthRequest {
  body: {
    newEmail: string;
  };
}
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const updateUserEmail = async (
  req: UserEmailRequest,
  res: Response
): Promise<any> => {
  const targetUserId = req.params.id;
  const { id: currUserId, isAdmin } = req.user || {};
  const { newEmail } = req.body;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      message: "Invalid user ID format",
      status: "ERROR",
      payload: null,
    });
  }

  if (!newEmail || !emailRegex.test(newEmail)) {
    return res.status(400).json({
      message: "Invalid email format",
      status: "ERROR",
      payload: null,
    });
  }

  if (currUserId !== targetUserId && !isAdmin) {
    return res.status(403).json({
      message: "You can't edit another user's email",
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

    if (user.email === newEmail) {
      return res.status(404).json({
        message: "You are already using this email",
        status: "ERROR",
        payload: null,
      });
    }

    // Check if email already exists for another user
    const existingEmailUser = await UserModel.findOne({
      email: newEmail,
      _id: { $ne: targetUserId }, // exclude the current user
    });
    if (existingEmailUser) {
      return res.status(409).json({
        message: "Email is already in use by another account",
        status: "ERROR",
        payload: null,
      });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      targetUserId,
      { email: newEmail },
      { new: true }
    );

    // Return minimal user info (id and email) to avoid info leak
    const responsePayload = {
      id: updatedUser?._id,
      email: updatedUser?.email,
    };

    return res.status(200).json({
      message: "Email changed successfully",
      status: "SUCCESS",
      payload: responsePayload,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to change email due to server error",
      status: "ERROR",
      payload: null,
    });
  }
};
