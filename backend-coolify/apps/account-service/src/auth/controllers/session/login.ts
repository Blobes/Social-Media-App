import { UserModel } from "@repo/database";
import {
  genAccessTokens,
  genRefreshTokens,
  IAuthRequest,
  userSensitiveFields,
  findUserSessions,
  upstashClient,
  CACHE_KEYS,
  IJwtUser,
  finalizeDeviceTrust,
  toJwtUser,
} from "@repo/shared";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

interface LoginRequest extends Request {
  body: {
    identifier: string;
    password: string;
    deviceId?: string;
  };
}

/**
 * Maps a unique Session ID to a Trusted Device and cleans up hardware collisions.
 */
const loginUser = async (req: LoginRequest, res: Response): Promise<any> => {
  const { identifier, password, deviceId: bodyDeviceId } = req.body;
  const deviceId = req.cookies["device_id"] || bodyDeviceId;

  if (!identifier || !password) {
    return res.status(400).json({
      status: "ERROR",
      message: "Credential and password are required.",
      payload: null,
    });
  }

  if (!deviceId) {
    return res.status(400).json({
      status: "ERROR",
      message: "Device ID required.",
      payload: null,
    });
  }

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

    if (user.isDeactivated) {
      return res.status(200).json({
        status: "DEACTIVATED",
        message: "Account deactivated.",
        payload: { userId: user._id, email: user.email },
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

    /**
     * 1. DB TRUST MAPPING
     * Update the hardware's trust status in the User Model registry.
     */
    await finalizeDeviceTrust(user, deviceId);

    /**
     * 2. REDIS HARDWARE ENFORCEMENT
     * Find any existing session keys in Redis that map to this deviceId
     * and delete them to prevent multiple sessions on one device.
     */
    const userId = user._id.toString();
    const existingDeviceSessions = await findUserSessions(
      userId,
      (s) => s.deviceId === deviceId,
    );

    if (existingDeviceSessions.length > 0) {
      const keysToDelete = existingDeviceSessions.map((s) => s.key);
      await upstashClient.del(...keysToDelete);
    }

    /**
     * 3. NEW SESSION INITIALIZATION
     * Generate a new unique sessionId and sync the primary anchor to cache.
     */
    const sessionId = uuidv4();

    // Sync Primary Device to Redis for middleware 'Owner' level checks
    await upstashClient.set(
      CACHE_KEYS.USER_PRIMARY_DEVICE(userId),
      user.primaryDeviceId,
    );

    const jwtUser = toJwtUser(user, deviceId, sessionId);
    // Refresh Tokens will map this sessionId to the deviceId in Redis
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
      message: error.message || "Internal server error.",
      payload: null,
    });
  }
};

export default loginUser;
