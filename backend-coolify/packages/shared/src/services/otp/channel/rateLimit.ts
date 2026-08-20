import { MESSAGES_REGISTRY } from "../../../constants/msgRegistry";
import { IAppError } from "../../../utils/error";
import { CacheService } from "../../redis/cache";

/**
 * Enforces dual-dimension rate limits (Phone + IP) on OTP dispatches to block SMS spam and toll fraud.
 */
export async function enforceOtpRateLimit(
  phoneNumber: string,
  userIp: string,
): Promise<void> {
  const sanitizedPhone = phoneNumber.replace(/\+/g, "");
  const phoneKey = `otp_guard:phone:${sanitizedPhone}`;
  const ipKey = `otp_guard:ip:${userIp}`;

  const client = CacheService.getClient();

  // Pipeline counter increments in a single batch to reduce network round-trips
  const incrementPipeline = client.pipeline();
  incrementPipeline.incr(phoneKey);
  incrementPipeline.incr(ipKey);

  const incrementResults = await incrementPipeline.exec();

  if (!incrementResults) {
    return;
  }

  const [phoneErr, rawPhoneCount] = incrementResults[0];
  const [ipErr, rawIpCount] = incrementResults[1];

  const currentPhoneRequests =
    !phoneErr && typeof rawPhoneCount === "number" ? rawPhoneCount : 0;
  const currentIpRequests =
    !ipErr && typeof rawIpCount === "number" ? rawIpCount : 0;

  // Pipeline TTL assignment for newly created keys
  const ttlPipeline = client.pipeline();
  let needsTtlExecution = false;

  if (currentPhoneRequests === 1) {
    ttlPipeline.expire(phoneKey, 600);
    needsTtlExecution = true;
  }

  if (currentIpRequests === 1) {
    ttlPipeline.expire(ipKey, 600);
    needsTtlExecution = true;
  }

  if (needsTtlExecution) {
    await ttlPipeline.exec();
  }

  if (currentPhoneRequests > 3) {
    const error: IAppError = new Error(
      MESSAGES_REGISTRY.AUTH.PHONE_OTP_LIMIT_EXCEEDED(10).message as string,
    );
    error.statusCode = 429;
    error.i18nKey = MESSAGES_REGISTRY.AUTH.PHONE_OTP_LIMIT_EXCEEDED(10).i18nKey;
    error.isOperational = true;
    throw error;
  }

  if (currentIpRequests > 10) {
    const error: IAppError = new Error(
      MESSAGES_REGISTRY.AUTH.SUSPICIOUS_ACTIVITY.message,
    );
    error.statusCode = 429;
    error.i18nKey = MESSAGES_REGISTRY.AUTH.SUSPICIOUS_ACTIVITY.i18nKey;
    error.isOperational = true;
    throw error;
  }
}
