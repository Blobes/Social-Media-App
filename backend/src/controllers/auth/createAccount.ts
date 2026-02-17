import {
  genAccessTokens,
  generateRandomIP,
  generateTestEmail,
  genRefreshTokens,
  genVerificationCode,
  getClientIp,
  getLocationFromIP,
  hashCode,
} from "@/helper";
import { UserModel } from "@/models";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { sendVerificationEmail } from "./sendEmailCode";

// Create a new user account
interface CreateRequest extends Request {
  body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
}
export const createAccount = async (
  req: CreateRequest,
  res: Response,
): Promise<any> => {
  const { email, password, firstName, lastName } = req.body;

  // Hashing password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate test email
  const testEmail = generateTestEmail(email);

  // Generate code
  const code = genVerificationCode();

  // Get user's Country & State from their IP address
  const userIp = getClientIp(req); // Real IP request header from production environment
  const randomIp = generateRandomIP(); //Random IP
  const userLocation = await getLocationFromIP(randomIp);

  //const provider = email.includes("gmail") ? "gmail" : email;

  const newUser = new UserModel({
    email: testEmail,
    password: hashedPassword,
    firstName,
    lastName,
    country: userLocation?.country,
    state: userLocation?.state,
    verificationCode: hashCode(code),
    verificationExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
  });

  try {
    // Send email
    await sendVerificationEmail({ to: email, code });
    // Save user to database
    await newUser.save();

    // Generate auth tokens
    const accessToken = genAccessTokens(newUser, req, res);
    const refreshToken = genRefreshTokens(newUser, req, res);

    // Remove sensitive data before sending response
    const { password: _, ...safeData } = newUser.toObject();
    res.status(200).json({
      message: "Registration successful. Verification code sent to email",
      accessToken: accessToken,
      refreshToken: refreshToken,
      payload: safeData,
      status: "SUCCESS",
    });
  } catch (error: any) {
    if (error.code === 11000) {
      if (error.keyPattern.email) {
        return res.status(409).json({ message: "Email already in use" });
      }
    }
    return res.status(500).json({ message: error.message });
  }
};
