import { UserModel } from "@repo/database";
import {
  genAccessTokens,
  genRefreshTokens,
  userSensitiveFields,
} from "@repo/shared";
import bcrypt from "bcrypt";
import { Request, Response } from "express";

interface LoginRequest extends Request {
  body: {
    identifier: string;
    password: string;
  };
}

const loginUser = async (req: LoginRequest, res: Response): Promise<any> => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      status: "ERROR",
      message: "Credential and password are required.",
      payload: null,
    });
  }

  const normalizedIdentifier = identifier.toLowerCase().trim();

  // Helper to determine the type of identifier for dynamic messaging
  const getIdentifierType = (val: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{10,}$/; // Basic check for digits/length

    if (emailRegex.test(val)) return "Email address";
    if (phoneRegex.test(val)) return "Phone number";
    return "Username";
  };

  const idType = getIdentifierType(normalizedIdentifier);

  try {
    // 1. Find active user
    let user = await UserModel.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: { $regex: new RegExp(`^${normalizedIdentifier}$`, "i") } },
        { phoneNumber: normalizedIdentifier },
      ],
    });

    // 2. Handle Deactivated or Not Found
    if (!user) {
      const deactivatedUser = await UserModel.findOne({
        $or: [
          {
            email: {
              $regex: new RegExp(`^${normalizedIdentifier}_deleted_`, "i"),
            },
          },
          {
            username: {
              $regex: new RegExp(`^${normalizedIdentifier}_deleted_`, "i"),
            },
          },
          {
            phoneNumber: {
              $regex: new RegExp(`^${normalizedIdentifier}_deleted_`, "i"),
            },
          },
        ],
      }).setOptions({ skipFilter: true });

      if (deactivatedUser) {
        return res.status(200).json({
          status: "DEACTIVATED",
          message: `The account associated with this ${idType.toLowerCase()} is deactivated. Please restore it to log in.`,
          payload: { userId: deactivatedUser._id },
        });
      }

      return res.status(400).json({
        status: "ERROR",
        message: `${idType} not found. Please check your spelling and try again.`,
        payload: null,
      });
    }

    // 3. Password Verification
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: "ERROR",
        message: `Incorrect password for this ${idType.toLowerCase()}.`,
        payload: null,
      });
    }

    // 4. Token Generation
    const accessToken = genAccessTokens(user, req, res);
    const refreshToken = genRefreshTokens(user, req, res);

    // 5. Sanitize response
    const safeData = user.toObject();
    userSensitiveFields().forEach((field) => {
      delete (safeData as any)[field];
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Logged in successfully.",
      accessToken,
      refreshToken,
      payload: safeData,
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Internal server error during login.",
      payload: null,
    });
  }
};

export default loginUser;
