import { verifyEncryptedPass } from "@/auth/helpers/encrypt";
import { UserModel } from "@repo/database";
import {
  userSensitiveFields,
  invalidatePattern,
  CACHE_KEYS,
  TransInfo,
  MESSAGES_REGISTRY,
  transformToASCII,
  normalizeValue,
} from "@repo/shared";

interface IChangeUsernameInput {
  userId: string;
  newUsername?: string;
  password?: string;
}

interface IChangeUsernameResult {
  status:
    | "SUCCESS"
    | "INVALID_USERNAME"
    | "NOT_FOUND"
    | "PASSWORD_REQUIRED"
    | "NO_PASSWORD_SET"
    | "INCORRECT_PASSWORD"
    | "COOLDOWN_ACTIVE"
    | "USERNAME_TAKEN";
  transInfo: TransInfo;
  payload?: any;
}

/**
 * Persists updated account identifier tags, manages time-based verification states, and flushes dependent workspace key lookups.
 */
export const executeUsernameChange = async (
  input: IChangeUsernameInput,
): Promise<IChangeUsernameResult> => {
  const { userId, newUsername, password } = input;
  const COOLDOWN_PERIOD = 90 * 24 * 60 * 60 * 1000;
  const GRACE_PERIOD_MS = 15 * 60 * 1000;

  const normalizedUsername = normalizeValue(newUsername);

  if (!normalizedUsername || normalizedUsername.length < 3) {
    return {
      status: "INVALID_USERNAME",
      transInfo: MESSAGES_REGISTRY.PROFILE.INVALID_USERNAME,
    };
  }

  const user = await UserModel.findById(userId).select("+password");
  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  // Check if password re-verification window is still active
  const lastVerified = user.lastPasswordVerifiedAt
    ? new Date(user.lastPasswordVerifiedAt).getTime()
    : 0;
  const isGracePeriodActive = Date.now() - lastVerified < GRACE_PERIOD_MS;

  if (!isGracePeriodActive) {
    if (!password) {
      return {
        status: "PASSWORD_REQUIRED",
        transInfo: MESSAGES_REGISTRY.AUTH.PASSWORD_REQUIRED,
      };
    }

    if (!user.password) {
      return {
        status: "NO_PASSWORD_SET",
        transInfo: MESSAGES_REGISTRY.AUTH.NO_PASSWORD_SET,
      };
    }
    const isMatch = await verifyEncryptedPass(password, user.password);
    if (!isMatch) {
      return {
        status: "INCORRECT_PASSWORD",
        transInfo: MESSAGES_REGISTRY.AUTH.INCORRECT_CURRENT_PASSWORD,
      };
    }

    // Update password confirmation state tracking
    user.lastPasswordVerifiedAt = new Date();
  }

  // Validate identity modification cadence restrictions
  if (user.lastUsernameChangeAt) {
    const nextAllowedDate =
      new Date(user.lastUsernameChangeAt).getTime() + COOLDOWN_PERIOD;
    if (Date.now() < nextAllowedDate) {
      const daysLeft = Math.ceil(
        (nextAllowedDate - Date.now()) / (24 * 60 * 60 * 1000),
      );
      return {
        status: "COOLDOWN_ACTIVE",
        transInfo: MESSAGES_REGISTRY.PROFILE.USERNAME_COOLDOWN_ACTIVE(daysLeft),
      };
    }
  }

  const usernameCanonical = transformToASCII(normalizedUsername);
  const conflict = await UserModel.findOne({
    usernameCanonical,
    _id: { $ne: userId },
  }).setOptions({ skipFilter: true });

  if (conflict) {
    return {
      status: "USERNAME_TAKEN",
      transInfo: MESSAGES_REGISTRY.PROFILE.USERNAME_TAKEN,
    };
  }

  user.username = normalizedUsername;
  user.usernameCanonical = usernameCanonical;
  user.lastUsernameChangeAt = new Date();
  await user.save();

  // Clear runtime profile lookup layers
  await invalidatePattern(CACHE_KEYS.WILDCARD_USER_ALL(userId));

  const safePayload = user.toObject();
  userSensitiveFields().forEach((field) => delete (safePayload as any)[field]);

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.PROFILE.USERNAME_UPDATED_SUCCESSFULLY,
    payload: safePayload,
  };
};
