import { UserModel } from "@/models";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { genAccessTokens, genRefreshTokens } from "@/helper";

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

const loginUser = async (req: LoginRequest, res: Response): Promise<any> => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    // Check if email exists
    if (!user) {
      return res.status(400).json({
        message: "Email not found. Please try again with a different email.",
        status: "ERROR",
        payload: null,
      });
    }

    // Check if password is correct
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({
        message: "Incorrect password",
        status: "ERROR",
        payload: null,
      });
    }
    // Generate auth tokens
    const accessToken = genAccessTokens(user, req, res);
    const refreshToken = genRefreshTokens(user, req, res);

    // Remove sensitive data before sending response
    const { password: _, ...safeData } = user.toObject();
    res.status(200).json({
      message: "Logged in successfully",
      accessToken: accessToken,
      refreshToken: refreshToken,
      payload: safeData,
      status: "SUCCESS",
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message || "Server error",
      status: "ERROR",
      payload: null,
    });
  }
};

export default loginUser;
