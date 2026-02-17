import mongoose from "mongoose";
import { UserModel } from "@/models";
import bcrypt from "bcrypt";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";

// Set up user demographics
interface DemographicsRequest extends AuthRequest {
  body: {
    gender: string;
    dateOfBirth: string;
    location: string;
    occupation: string;
    relationship: string;
  };
}
export const demographicsSetup = async (
  req: DemographicsRequest,
  res: Response
): Promise<any> => {
  const targetUserId = req.params.id;
  const { id: currUserId, isAdmin } = req.user || {};
  const { gender, dateOfBirth, location, occupation, relationship } = req.body;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({
      message: "Invalid user ID format",
      status: "ERROR",
      payload: null,
    });
  }
};
