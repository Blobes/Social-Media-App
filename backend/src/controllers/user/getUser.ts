import mongoose from "mongoose";
import { UserModel } from "@/models";
import { Request, Response } from "express";

const getUser = async (req: Request, res: Response): Promise<any> => {
  const userId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      message: "Invalid user ID format",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    // Select only relevant fields - exclude password, __v, etc.
    const user = await UserModel.findById(userId).select("-password -__v");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: "ERROR",
        payload: null,
      });
    }

    res.status(200).json({
      message: "User fetched successfully",
      status: "SUCCESS",
      payload: user,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Failed to get user due to server error",
      status: "ERROR",
      payload: null,
    });
  }
};

export default getUser;
