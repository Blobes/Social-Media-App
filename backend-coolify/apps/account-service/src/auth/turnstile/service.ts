import { MESSAGES_REGISTRY, TransInfo } from "@repo/shared";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

export type TurnstileVerificationStatus =
  | "SUCCESS"
  | "MISSING_INPUT"
  | "CONFIG_ERROR"
  | "INVALID_TOKEN";

export interface TurnstileVerificationResult {
  status: TurnstileVerificationStatus;
  transInfo: TransInfo;
}

/**
 * Validates a Cloudflare Turnstile challenge token against the siteverify API endpoint.
 */
export async function verifyTurnstileToken(
  token?: string,
  userIp?: string,
): Promise<TurnstileVerificationResult> {
  if (!token) {
    return {
      status: "MISSING_INPUT",
      transInfo: MESSAGES_REGISTRY.AUTH.TURNSTILE_TOKEN_MISSING,
    };
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    return {
      status: "CONFIG_ERROR",
      transInfo: MESSAGES_REGISTRY.AUTH.TURNSTILE_CONFIG_INVALID,
    };
  }

  const formData = new URLSearchParams();
  formData.append("secret", secretKey);
  formData.append("response", token);

  if (userIp) {
    formData.append("remoteip", userIp);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  const data = (await response.json()) as TurnstileVerifyResponse;

  if (!data.success) {
    return {
      status: "INVALID_TOKEN",
      transInfo: MESSAGES_REGISTRY.AUTH.TURNSTILE_VERIFICATION_FAILED,
    };
  }
  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.TURNSTILE_VERIFICATION_SUCCESS,
  };
}
