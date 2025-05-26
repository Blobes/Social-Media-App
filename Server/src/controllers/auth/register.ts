import { genAccessTokens, genRefreshTokens } from "@/helper";
import { UserModel } from "@/models";
import bcrypt from "bcrypt";
import { Request, Response } from "express";

// Register new user
interface RegRequest extends Request {
  body: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  };
}
const registerUser = async (req: RegRequest, res: Response): Promise<any> => {
  const { email, username, password, firstName, lastName } = req.body;

  // Hashing password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new UserModel({
    email,
    username,
    password: hashedPassword,
    firstName,
    lastName,
  });

  try {
    await newUser.save();
    // Generate auth tokens
    const accessToken = genAccessTokens(newUser, res);
    const refreshToken = genRefreshTokens(newUser, res);

    // Remove sensitive data before sending response
    const { password: _, ...safeData } = newUser.toObject();
    res.status(200).json({
      message: "Registration successful",
      accessToken: accessToken,
      refreshToken: refreshToken,
      payload: safeData,
      status: "SUCCESS",
    });
  } catch (error: any) {
    if (error.code === 11000) {
      if (error.keyPattern.username) {
        return res.status(409).json({ message: "Username already taken" });
      }
      if (error.keyPattern.email) {
        return res.status(409).json({ message: "Email already in use" });
      }
      res.status(500).json({ message: error.message });
    }
  }
};
export default registerUser;
