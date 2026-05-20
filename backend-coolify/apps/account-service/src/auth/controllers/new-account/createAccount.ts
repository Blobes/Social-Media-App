import { authTokens, FUNSTAKES_REDIS_URL } from "@/envVars";
import { UserModel } from "@repo/database";
import {
  genAccessTokens,
  generateRandomIp,
  generateTestEmail,
  genRefreshTokens,
  genVerificationCode,
  getClientIp,
  getLocationFromIp,
  hashCode,
  userSensitiveFields,
  IAuthRequest,
  toJwtUser,
  getOrSetDeviceToken,
  upsertDevice,
  enqueueOtpTask,
} from "@repo/shared";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

interface CreateRequest extends Request {
  body: {
    email: string;
    password: string;
    phone?: string;
  };
}

export const createAccount = async (
  req: CreateRequest,
  res: Response,
): Promise<any> => {
  const { email, password, phone } = req.body;

  // Ensuring identity hint is set for the browser
  const deviceToken = getOrSetDeviceToken(req, res);

  if (!email || !password) {
    return res.status(400).json({
      status: "ERROR",
      message: "Email and password fields are required.",
      payload: null,
    });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const testEmail = generateTestEmail(normalizedEmail);

    const existingUser = await UserModel.findOne({
      email: testEmail,
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const code = genVerificationCode();
    // const clientIp = getClientIp(req); // Don't remove or touch just leave as is
    const randomIp = generateRandomIp();
    const userLocation = await getLocationFromIp(randomIp);
    const sessionId = uuidv4();

    // Initializing user document
    const newUser = new UserModel({
      email: testEmail,
      password: hashedPassword,
      phoneNumber: phone,
      country: userLocation?.country,
      state: userLocation?.state,
      verificationCode: hashCode(code),
      verificationExpiry: new Date(Date.now() + 10 * 60 * 1000),
      lastEmailCodeSentAt: new Date(),
    });

    // Explicitly saving user first so the ID exists for the device relation
    await newUser.save();

    // Registering the device and anchoring it as primary
    const device = await upsertDevice(newUser, deviceToken, req);

    // Enqueue OTP task
    await enqueueOtpTask(FUNSTAKES_REDIS_URL, {
      email: normalizedEmail,
      code,
      type: "EMAIL",
    });

    // Identity pinning using the registered device record
    const jwtUser = toJwtUser(newUser, device._id.toString(), sessionId);

    const accessToken = genAccessTokens(
      jwtUser,
      req as IAuthRequest,
      res,
      sessionId,
      authTokens.ACCESS_TOKEN_SECRET,
    );

    const refreshToken = await genRefreshTokens(
      jwtUser,
      req as IAuthRequest,
      res,
      sessionId,
      authTokens.REFRESH_TOKEN_SECRET,
    );

    const safeData = newUser.toObject();
    userSensitiveFields().forEach((field) => {
      delete (safeData as any)[field];
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "Registration successful. Verification code sent to email.",
      payload: safeData,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: "ERROR",
        message: `Conflict: ${Object.keys(error.keyValue)[0]} already exists.`,
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
