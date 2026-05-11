import { authTokens } from "@/envVars";
import { IUserDocument, UserModel } from "@repo/database";
import {
  genAccessTokens,
  genRefreshTokens,
  IAuthRequest,
  userSensitiveFields,
  upstashClient,
  CACHE_KEYS,
  toJwtUser,
  getOrSetDeviceToken,
  upsertDevice,
  evaluateDeviceTrust,
} from "@repo/shared";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

interface LoginRequest extends Request {
  body: {
    identifier: string;
    password: string;
  };
}
/**
 * Executes the login flow using the decoupled Device Registry and Redis session management.
 */
export const loginUser = async (
  req: LoginRequest,
  res: Response,
): Promise<any> => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      status: "ERROR",
      message: "Credential and password are required.",
      payload: null,
    });
  }

  const deviceToken = getOrSetDeviceToken(req, res);
  const normalizedIdentifier = identifier.toLowerCase().trim();

  try {
    const user = await UserModel.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: { $regex: new RegExp(`^${normalizedIdentifier}$`, "i") } },
        { phoneNumber: normalizedIdentifier },
      ],
    }).setOptions({ skipFilter: true });

    if (!user) {
      return res.status(400).json({
        status: "ERROR",
        message: "User not found.",
        payload: null,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "UNAUTHORIZED",
        message: "Incorrect password.",
        payload: null,
      });
    }

    // 1. HARDWARE REGISTRY & PRIMARY SELF-HEAL:
    // upsertDevice internally calls ensurePrimaryDevice(user, device._id).
    const device = await upsertDevice(user, deviceToken, req);

    const userId = user._id.toString();
    const deviceIdString = device._id.toString();

    // 2. SESSION INITIALIZATION
    const sessionId = uuidv4();

    // Sync the primary device reference for high-speed middleware checks
    await upstashClient.set(
      CACHE_KEYS.USER_PRIMARY_DEVICE(userId),
      user.primaryDeviceId?.toString(),
    );

    const jwtUser = toJwtUser(user as IUserDocument, deviceIdString, sessionId);

    const accessToken = genAccessTokens(
      jwtUser,
      req as IAuthRequest,
      res,
      sessionId,
      authTokens.ACCESS_TOKEN_SECRET,
    );

    await genRefreshTokens(
      jwtUser,
      req as IAuthRequest,
      res,
      sessionId,
      authTokens.REFRESH_TOKEN_SECRET,
    );

    // Update last password verification
    user.lastPasswordVerifiedAt = new Date();
    await user.save();

    const safeData = user.toObject();
    userSensitiveFields().forEach((field) => {
      delete (safeData as any)[field];
    });

    // Evaluate if the hardware is known and verified within the trust window
    const trust = await evaluateDeviceTrust(device);
    const isVerified = safeData.isEmailVerified || safeData.isPhoneVerified;
    const requireOtp = !isVerified || !trust.trusted;

    return res.status(200).json({
      status: "SUCCESS",
      message: "Logged in successfully.",
      accessToken,
      payload: safeData,
      requireOtp,
      otpReason: requireOtp
        ? !isVerified
          ? "UNVERIFIED_ACCOUNT"
          : "UNTRUSTED_DEVICE"
        : undefined, // Helpful for debugging (NEW_DEVICE vs STALE_DEVICE)
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Internal server error.",
      payload: null,
    });
  }
};
