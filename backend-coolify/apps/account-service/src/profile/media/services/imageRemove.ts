import { UserModel } from "@repo/database";
import {
  userSensitiveFields,
  invalidateCache,
  CACHE_KEYS,
  softDeleteMedia,
  TransInfo,
  MESSAGES_REGISTRY,
} from "@repo/shared";
import { UserImageType } from "./imageChange";

interface IRemoveUserImageInput {
  authUserId: string;
  imageType: UserImageType;
}

interface IRemoveUserImageResult {
  status: "SUCCESS" | "NOT_FOUND";
  transInfo?: TransInfo;
  payload?: any;
}

/**
 * Removes active image asset links from user records and triggers cache evictions.
 */
export const executeUserImageRemoval = async (
  input: IRemoveUserImageInput,
): Promise<IRemoveUserImageResult> => {
  const { authUserId, imageType } = input;
  const fieldToUpdate = imageType === "PROFILE" ? "profileImage" : "coverImage";

  // Execute soft delete to handle the database reference update
  const updatedUser = await softDeleteMedia({
    model: UserModel as any,
    id: authUserId,
    field: fieldToUpdate,
    populateFields: ["profileImage", "coverImage"],
  });

  if (!updatedUser) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }
  // Clear stale data lookup entries
  await invalidateCache(CACHE_KEYS.USER_PROFILE(authUserId));

  // Purge sensitive configuration targets
  const safePayload = updatedUser.toObject();
  userSensitiveFields().forEach((field) => {
    delete (safePayload as any)[field];
  });

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.PROFILE.IMAGE_REMOVAL_SUCCESS(
      imageType === "PROFILE" ? "Profile" : "Cover",
    ),
    payload: safePayload,
  };
};
