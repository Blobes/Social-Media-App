import { UserModel } from "@repo/database";
import {
  userSensitiveFields,
  CACHE_KEYS,
  invalidateCache,
  evaluateNotability,
  TransInfo,
  MESSAGES_REGISTRY,
} from "@repo/shared";

interface IUpdateBasicInfoInput {
  authUserId: string;
  firstName?: string;
  lastName?: string;
  about?: string;
  interests?: string[];
  website?: string;
  occupation?: string;
}
interface IUpdateBasicInfoResult {
  status: "SUCCESS" | "NOT_FOUND";
  transInfo: TransInfo;
  payload?: any;
  requiresIdVerification?: boolean;
}

/**
 * Recalculates platform notability settings upon identity changes and stores profile mutations.
 */
export const updateAccountBasicInfo = async (
  input: IUpdateBasicInfoInput,
): Promise<IUpdateBasicInfoResult> => {
  const {
    authUserId,
    firstName,
    lastName,
    about,
    interests,
    website,
    occupation,
  } = input;

  const user = await UserModel.findById(authUserId);
  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  // Recalculate background profiling parameters if structural identity metrics mutate
  let isVIPCandidate = false;

  const isFirstNameChanged =
    firstName !== undefined && firstName !== user.firstName;
  const isLastNameChanged =
    lastName !== undefined && lastName !== user.lastName;

  if (isFirstNameChanged || isLastNameChanged) {
    const updatedFirstName = firstName || user.firstName;
    const updatedLastName = lastName || user.lastName;
    const fullName = `${updatedFirstName} ${updatedLastName}`;

    const notability = await evaluateNotability(
      fullName,
      user.email,
      user.phoneNumber || undefined,
    );
    isVIPCandidate = notability.isVIPCandidate;

    user.meritsVerification = notability.isVIPCandidate;
    user.isNotable = notability.isVIPCandidate;
    user.verificationSignals = {
      hasWikipedia: notability.signals.notableName,
      isVipEmail: notability.signals.proEmail,
      isVipPhone: notability.signals.validPhone,
    };
  }

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (about !== undefined) user.about = about;
  if (interests !== undefined) user.interests = interests;
  if (website !== undefined) user.website = website;
  if (occupation !== undefined) user.occupation = occupation;

  await user.save();

  // Flush stale storage blocks before compiling response sets
  await invalidateCache(CACHE_KEYS.USER_PROFILE(authUserId));

  const safePayload = user.toObject();
  userSensitiveFields().forEach((field) => {
    delete (safePayload as any)[field];
  });

  return {
    status: "SUCCESS",
    transInfo:
      MESSAGES_REGISTRY.PROFILE.USER_BASIC_DETAILS_UPDATED_SUCCESSFULLY,
    payload: safePayload,
    requiresIdVerification: isVIPCandidate,
  };
};
