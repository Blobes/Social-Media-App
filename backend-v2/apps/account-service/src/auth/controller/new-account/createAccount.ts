import { UserModel } from "@repo/database";
import {
  dispatchEmailCode,
  evaluateNotability,
  genAccessTokens,
  generateRandomIP,
  generateTestEmail,
  genRefreshTokens,
  genVerificationCode,
  getClientIp,
  getLocationFromIP,
  hashCode,
  userSensitiveFields,
  IAuthRequest,
} from "@repo/shared";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

interface CreateRequest extends Request {
  body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

export const createAccount = async (
  req: CreateRequest,
  res: Response,
): Promise<any> => {
  const { email, password, firstName, lastName, phone } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      status: "ERROR",
      message: "All fields are required.",
      payload: null,
    });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await UserModel.findOne({
      $or: [
        { email: normalizedEmail },
        { email: { $regex: new RegExp(`^${normalizedEmail}_deleted_`) } },
      ],
    }).setOptions({ skipFilter: true });

    if (existingUser) {
      if (existingUser.isDeactivated) {
        return res.status(409).json({
          status: "DEACTIVATED",
          message: "This email belongs to a deactivated account.",
          payload: { userId: existingUser._id },
        });
      }
      return res.status(409).json({
        status: "ERROR",
        message: "Email already in use.",
        payload: null,
      });
    }

    const fullName = `${firstName} ${lastName}`;
    const notability = await evaluateNotability(
      fullName,
      normalizedEmail,
      phone,
    );

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const code = genVerificationCode();

    // 1. CAPTURE REAL IP: For the Upstash session metadata
    const userIp = getClientIp(req);

    // 2. CAPTURE TEST/RANDOM DATA: For location and anonymization logic
    const testEmail = generateTestEmail(normalizedEmail);
    const randomIp = generateRandomIP();
    const userLocation = await getLocationFromIP(randomIp);

    const sessionId = uuidv4();

    const newUser = new UserModel({
      email: testEmail,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber: phone || null,
      country: userLocation?.country,
      state: userLocation?.state,
      verificationCode: hashCode(code),
      verificationExpiry: new Date(Date.now() + 10 * 60 * 1000),
      lastEmailCodeSentAt: new Date(),

      // Assign primary device ID
      primarySessionId: sessionId,

      isNotable: notability.isVIPCandidate,
      meritsVerification: notability.isVIPCandidate,
      verificationSignals: {
        hasWikipedia: notability.signals.notableName,
        isVipEmail: notability.signals.proEmail,
        isVipPhone: notability.signals.validPhone,
      },
    });

    await dispatchEmailCode({ to: normalizedEmail, code });
    await newUser.save();

    // The genRefreshTokens utility uses req.ip (via IAuthRequest)
    // to save the 'userIp' we captured above into Redis.
    const accessToken = genAccessTokens(
      newUser,
      req as IAuthRequest,
      res,
      sessionId,
    );
    const refreshToken = await genRefreshTokens(
      newUser,
      req as IAuthRequest,
      res,
      sessionId,
    );

    const safeData = newUser.toObject();
    userSensitiveFields().forEach((field) => {
      delete (safeData as any)[field];
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Registration successful. Verification code sent to email.",
      payload: {
        ...safeData,
        requiresIdVerification: notability.isVIPCandidate,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: "ERROR",
        message: "Email already in use.",
        payload: null,
      });
    }

    console.error("Registration Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Internal server error during registration.",
      payload: null,
    });
  }
};
