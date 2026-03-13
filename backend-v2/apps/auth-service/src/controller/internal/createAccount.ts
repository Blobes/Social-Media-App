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
} from "@repo/shared";
import bcrypt from "bcrypt";
import { Request, Response } from "express";

// Create a new user account
interface CreateRequest extends Request {
  body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string; // Optional phone for VIP check
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

    // 1. Check for existing account
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

    // NEW: 1.5 Evaluate Notability (Public Figure Detection)
    const fullName = `${firstName} ${lastName}`;
    const notability = await evaluateNotability(
      fullName,
      normalizedEmail,
      phone,
    );

    // 2. Prepare security data
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const code = genVerificationCode();

    // 3. Keep your testing logic
    const testEmail = generateTestEmail(normalizedEmail);

    // 4. Location handling
    const userIp = getClientIp(req);
    const randomIp = generateRandomIP();
    const userLocation = await getLocationFromIP(randomIp);

    // 5. Create User Instance with Notability Fields
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

      // Integrate the Notability results
      isNotable: notability.isVIPCandidate,
      meritsVerification: notability.isVIPCandidate,
      verificationSignals: {
        hasWikipedia: notability.signals.notableName,
        isVipEmail: notability.signals.proEmail,
        isVipPhone: notability.signals.validPhone,
      },
    });

    // 6. Send verification email
    await dispatchEmailCode({ to: normalizedEmail, code });

    // 7. Save to Database
    await newUser.save();

    // 8. Auth Tokens
    const accessToken = genAccessTokens(newUser, req, res);
    const refreshToken = genRefreshTokens(newUser, req, res);

    // 9. Sanitize response
    const safeData = newUser.toObject();
    userSensitiveFields().forEach((field) => {
      delete (safeData as any)[field];
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Registration successful. Verification code sent to email.",
      payload: {
        ...safeData,
        requiresIdVerification: notability.isVIPCandidate, // Helper for frontend routing
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
