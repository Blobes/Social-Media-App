import { NextFunction, Request, Response } from "express";
import {
  forwardError,
  getClientIp,
  IAuthRequest,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { verifyTurnstileToken } from "./service";

interface TurnstileVerifyRequest extends IAuthRequest {
  body: {
    token: string;
  };
}

/**
 * Controller endpoint managing the validation of Cloudflare Turnstile captcha tokens.
 */
export const turnstileVerification = async (
  req: TurnstileVerifyRequest,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  const { token } = req.body;
  const userIp = getClientIp(req);

  try {
    const serviceResult = await verifyTurnstileToken(token, userIp);

    if (serviceResult.status === "MISSING_INPUT") {
      return res.status(400).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "CONFIG_ERROR") {
      return res.status(500).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    if (serviceResult.status === "INVALID_TOKEN") {
      return res.status(401).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: null,
    });
  } catch (error: unknown) {
    console.error("Turnstile Verification Operational Fault:", error);

    return forwardError(
      next,
      MESSAGES_REGISTRY.AUTH.SERVER_FALLBACK_ERROR,
      error,
    );
  }
};
