import mongoose from "mongoose";
import { UserModel } from "@/models/user/user";
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
  res: Response,
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
      { new: true },
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
