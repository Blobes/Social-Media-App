import { IUsernameCanonical } from "@/auth/check/service";
import { verifyEncryptedPass } from "@/auth/helpers/encrypt";
import {
  userSensitiveFields,
  TransInfo,
  MESSAGES_REGISTRY,
  transformToASCII,
  normalizeValue,
  fetchSingleUser,
  checkUserExists,
  fetchManyUsers,
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
  suggestions?: string[];
  payload?: unknown;
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

  const user = await fetchSingleUser({
    identifier: userId,
    select: ["+password"],
    flags: { lean: false, skipFilter: true },
  });

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

  const canonicalized = transformToASCII(normalizedUsername);
  const isTaken = await checkUserExists({
    query: {
      usernameCanonical: canonicalized,
      _id: { $ne: userId },
    },
    flags: { skipFilter: true },
  });

  if (isTaken) {
    const suggestions: string[] = [];
    const suggestionRegex = new RegExp(`^${canonicalized}\\d*$`, "i");

    const takenDocs = await fetchManyUsers<IUsernameCanonical>({
      query: { usernameCanonical: suggestionRegex },
      select: ["usernameCanonical"],
      limit: 100,
      flags: { skipFilter: true, includeSensitiveFields: false },
    });

    const takenSet = new Set(
      takenDocs
        .map((u) => u.usernameCanonical)
        .filter((name): name is string => typeof name === "string")
        .map((name) => name.toLowerCase()),
    );

    let counter = 1;
    while (suggestions.length < 5) {
      const candidateSuffix = `${counter}`;
      const candidateCanonical = `${canonicalized}${candidateSuffix}`;
      if (!takenSet.has(candidateCanonical.toLowerCase())) {
        const displayCandidate = `${normalizedUsername}${candidateSuffix}`;
        suggestions.push(displayCandidate);
      }
      counter++;
      if (counter > 100) break;
    }
    return {
      status: "USERNAME_TAKEN",
      transInfo: MESSAGES_REGISTRY.PROFILE.USERNAME_TAKEN,
      suggestions,
    };
  }

  user.username = normalizedUsername;
  user.usernameCanonical = canonicalized;
  user.lastUsernameChangeAt = new Date();
  await user.save();

  // const safePayload = user.toObject() as Record<string, unknown>;
  // userSensitiveFields().forEach((field) => {
  //   delete safePayload[field];
  // });

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.PROFILE.USERNAME_UPDATED_SUCCESSFULLY,
    payload: user,
  };
};
