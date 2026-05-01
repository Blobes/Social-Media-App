import { UserModel } from "@repo/database";
import {
  evaluateNotability,
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
  otpQueue,
  OtpType,
  upstashClient,
  CACHE_KEYS,
  finalizeDeviceTrust,
  toJwtUser,
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
  const deviceId = req.cookies["device_id"] || "unknown";

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      status: "ERROR",
      message: "All fields are required.",
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

    const fullName = `${firstName} ${lastName}`;
    const notability = await evaluateNotability(
      fullName,
      normalizedEmail,
      phone,
    );

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const code = genVerificationCode();

    const randomIp = generateRandomIp();
    const userLocation = await getLocationFromIp(randomIp);

    const sessionId = uuidv4();

    /**
     * INITIALIZE USER WITH HARDWARE ANCHOR
     * We set the primaryDeviceId to the current device.
     */
    const newUser = new UserModel({
      email: testEmail,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber: phone,
      country: userLocation?.country,
      state: userLocation?.state,
      verificationCode: hashCode(code),
      verificationExpiry: new Date(Date.now() + 10 * 60 * 1000),
      lastEmailCodeSentAt: new Date(),

      // Updated: Use primaryDeviceId instead of primarySessionId
      primaryDeviceId: deviceId,

      isNotable: notability.isVIPCandidate,
      meritsVerification: notability.isVIPCandidate,
      verificationSignals: {
        hasWikipedia: notability.signals.notableName,
        isVipEmail: notability.signals.proEmail,
        isVipPhone: notability.signals.validPhone,
      },
    });

    /**
     * TRUST FINALIZATION
     * Add this device to the trustedDevices registry.
     */
    await finalizeDeviceTrust(newUser, deviceId);
    await newUser.save();

    await otpQueue().add(
      "send-email-otp",
      { email: normalizedEmail, code, type: "EMAIL" as OtpType },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
      },
    );

    const jwtUser = toJwtUser(newUser, deviceId, sessionId);

    const accessToken = genAccessTokens(
      jwtUser,
      req as IAuthRequest,
      res,
      sessionId,
    );
    const refreshToken = await genRefreshTokens(
      jwtUser,
      req as IAuthRequest,
      res,
      sessionId,
    );

    // Prepare session metadata for Redis
    const sessionKey = CACHE_KEYS.USER_SESSION(
      newUser._id.toString(),
      sessionId,
    );
    await upstashClient.set(
      sessionKey,
      {
        deviceId,
        userAgent: req.get("user-agent") || "unknown",
        ip: getClientIp(req),
        lastActive: new Date(),
      },
      { ex: 20 * 24 * 60 * 60 }, // 20 days
    );

    const safeData = newUser.toObject();
    userSensitiveFields().forEach((field) => {
      delete (safeData as any)[field];
    });

    /**
     * CACHE SYNC:
     * Map the Primary Device to the user so middlewares can verify trust instantly.
     */
    await upstashClient.set(
      CACHE_KEYS.USER_PRIMARY_DEVICE(safeData._id.toString()),
      deviceId,
      { ex: 3600 },
    );

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
