import { UserModel } from "@repo/database";
import {
  userSensitiveFields,
  CACHE_KEYS,
  invalidateCache,
  TransInfo,
  MESSAGES_REGISTRY,
} from "@repo/shared";

interface IUpdateDemoInfoInput {
  authUserId: string;
  gender?: string;
  dateOfBirth?: string;
  location?: string;
  relationship?: string;
}
interface IUpdateDemoInfoResult {
  status: "SUCCESS" | "NOT_FOUND";
  transInfo: TransInfo;
  payload?: any;
}

/**
 * Persists user demographic modifications, evicts runtime profile caches, and sanitizes outgoing documents.
 */
export const updateAccountDemoInfo = async (
  input: IUpdateDemoInfoInput,
): Promise<IUpdateDemoInfoResult> => {
  const { authUserId, gender, dateOfBirth, location, relationship } = input;

  const updatedUser = await UserModel.findByIdAndUpdate(
    authUserId,
    {
      $set: {
        gender,
        dateOfBirth,
        location,
        relationship,
      },
    },
    { new: true, runValidators: true },
  );

  if (!updatedUser) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }
  // Clear stale profiling cache values immediately to keep client layers accurate
  await invalidateCache(CACHE_KEYS.USER_PROFILE(authUserId));

  const safePayload = updatedUser.toObject();
  userSensitiveFields().forEach((field) => {
    delete (safePayload as any)[field];
  });
  return {
    status: "SUCCESS",
    transInfo:
      MESSAGES_REGISTRY.PROFILE.DEMOGRAPHIC_INFORMATION_UPDATED_SUCCESSFULLY,
    payload: safePayload,
  };
};
