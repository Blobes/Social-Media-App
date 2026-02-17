import mongoose from "mongoose";
import { UserModel } from "@/models";
import bcrypt from "bcrypt";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";

// Set up user demographics
interface ProfileSetupRequest extends AuthRequest {
  body: {
    username: string;
    gender: string;
    dateOfBirth: string;
    location: string;
    occupation: string;
    relationship: string;
  };
}

export const profileSetup = async (
  req: ProfileSetupRequest,
  res: Response
): Promise<any> => {
  const targetUserId = req.params.id;
  const { id: currUserId, isAdmin } = req.user || {};
  const { username, gender, dateOfBirth, location, occupation, relationship } =
    req.body;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      message: "Invalid user ID format",
      status: "ERROR",
      payload: null,
    });
  }
};

/*catch (error: any) {
  if (error.code === 11000) {
    if (error.keyPattern.username) {
      return res.status(409).json({ message: "Username already taken" });
    }
    if (error.keyPattern.email) {
      return res.status(409).json({ message: "Email already in use" });
    }
  }
  res.status(500).json({ message: error.message });
}*/
