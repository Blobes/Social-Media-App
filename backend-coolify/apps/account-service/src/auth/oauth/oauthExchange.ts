import { Request, Response } from "express";
import {
  authenticateWithOAuth,
  OAuthPurpose,
  OAuthProvider,
} from "./executeOAuth";
import { getOrSetDeviceToken, MESSAGES_REGISTRY } from "@repo/shared";
import { setAuthCookies } from "@repo/security";

/**
 * Controller endpoint to exchange validated provider credentials for platform session JWTs.
 */
export const oauthExchange = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const {
    provider,
    idToken,
    purpose = "LOGIN",
    identityPayload,
  } = req.body as {
    provider?: OAuthProvider;
    idToken?: string;
    purpose?: OAuthPurpose;
    identityPayload?: { firstName?: string; lastName?: string };
  };
  const deviceToken = getOrSetDeviceToken(req, res);
  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.ip || req.socket.remoteAddress || "";

  if (!provider || !idToken || !deviceToken) {
    return res.status(400).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.MISSING_TOKENS,
      payload: null,
    });
  }

  try {
    const result = await authenticateWithOAuth({
      provider,
      idToken,
      deviceToken,
      userAgent,
      ipAddress,
      purpose,
      identityPayload,
    });

    if (result.status === "NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        ...result.transInfo,
        payload: null,
      });
    }

    if (result.status === "CONFLICT_EMAIL_IN_USE") {
      return res.status(409).json({
        status: "ERROR",
        ...result.transInfo,
        payload: null,
      });
    }

    if (
      result.status === "ACCOUNT_DEACTIVATED" ||
      result.status === "ACCOUNT_SUSPENDED" ||
      result.status === "ACCOUNT_BANNED"
    ) {
      return res.status(403).json({
        status: "ERROR",
        ...result.transInfo,
        payload: null,
      });
    }

    if (result.status === "MERGE_RESTRICTION") {
      return res.status(400).json({
        status: "ERROR",
        ...result.transInfo,
        payload: null,
      });
    }

    if (result.accessToken && result.refreshToken) {
      setAuthCookies(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...result.transInfo,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      payload: result.payload,
    });
  } catch (error: any) {
    console.error("OAuth Exchange Error:", error);

    if (error.message === "INVALID_OAUTH_TOKEN") {
      return res.status(401).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.INVALID_OAUTH_TOKEN,
        payload: null,
      });
    }

    if (error.message === "UNSUPPORTED_OAUTH_PROVIDER") {
      return res.status(401).json({
        status: "ERROR",
        ...MESSAGES_REGISTRY.AUTH.UNSUPPORTED_OAUTH_PROVIDER,
        payload: null,
      });
    }

    return res.status(500).json({
      status: "ERROR",
      ...(error.message
        ? MESSAGES_REGISTRY.AUTH.SERVER_THROWN_ERROR(error.message)
        : MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR),
      payload: null,
    });
  }
};
