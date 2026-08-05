import { UserModel } from "@repo/database";
import {
  userSensitiveFields,
  softDeleteMedia,
  TransInfo,
  MESSAGES_REGISTRY,
  sanitizeUserResult,
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
    model: UserModel,
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

  // Purge sensitive configuration targets
  const safePayload = sanitizeUserResult(updatedUser, userSensitiveFields());

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.PROFILE.IMAGE_REMOVAL_SUCCESS(
      imageType === "PROFILE" ? "Profile" : "Cover",
    ),
    payload: safePayload,
  };
};
