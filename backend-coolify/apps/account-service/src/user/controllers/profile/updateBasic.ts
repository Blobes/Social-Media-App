import { UserModel } from "@repo/database";
import {
  IAuthRequest,
  evaluateNotability,
  userSensitiveFields,
  invalidateCache,
  CACHE_KEYS,
} from "@repo/shared";
import { Response } from "express";

interface InfoRequest extends IAuthRequest {
  firstName?: string;
  lastName?: string;
  about?: string;
  interests?: string[];
  website?: string;
  occupation?: string;
}

export const updateBasicInfo = async (
  req: InfoRequest,
  res: Response,
): Promise<any> => {
  const authUserId = req.user?.id;
  const { firstName, lastName, about, interests, website, occupation } =
    req.body as InfoRequest;

  // Fail fast if unauthorized
  if (!authUserId) {
    return res.status(401).json({
      message: "Unauthorized access",
      status: "ERROR",
      payload: null,
    });
  }

  try {
    const user = await UserModel.findById(authUserId);

    if (!user) {
      return res.status(404).json({
        message: "User account not found or deactivated",
        status: "ERROR",
        payload: null,
      });
    }

    // --- RE-EVALUATE NOTABILITY IF NAME CHANGES ---
    let isVIPCandidate = false;
    if (firstName || lastName) {
      const updatedFirstName = firstName || user.firstName;
      const updatedLastName = lastName || user.lastName;
      const fullName = `${updatedFirstName} ${updatedLastName}`;

      const notability = await evaluateNotability(
        fullName,
        user.email,
        user.phoneNumber || undefined,
      );
      isVIPCandidate = notability.isVIPCandidate;

      // Update flags based on new name identity signals
      user.meritsVerification = notability.isVIPCandidate;
      user.isNotable = notability.isVIPCandidate;
      user.verificationSignals = {
        hasWikipedia: notability.signals.notableName,
        isVipEmail: notability.signals.proEmail,
        isVipPhone: notability.signals.validPhone,
      };
    }

    // --- APPLY UPDATES ---
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (about !== undefined) user.about = about;
    if (interests !== undefined) user.interests = interests;
    if (website !== undefined) user.website = website;
    if (occupation !== undefined) user.occupation = occupation;

    await user.save();

    // Invalidate the cache after successful save to ensure data consistency
    await invalidateCache(CACHE_KEYS.USER_PROFILE(authUserId));

    const safePayload = user.toObject();

    // Clean internal security fields
    userSensitiveFields().forEach((field) => {
      delete (safePayload as any)[field];
    });

    return res.status(200).json({
      message: "User basic details updated successfully",
      status: "SUCCESS",
      payload: safePayload,
      requiresIdVerification: isVIPCandidate,
    });
  } catch (error: any) {
    console.error("Update Info Error:", error);
    return res.status(500).json({
      message: error.message || "Failed to update user info",
      status: "ERROR",
      payload: null,
    });
  }
};
