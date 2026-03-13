import { UserModel } from "@/models/user/user";
import { Response } from "express";
import { AuthRequest } from "@/middlewares/verifyAuthToken";
import { userSensitiveFields } from "@/utils/sanitize";
import { evaluateNotability } from "@/utils/checkNotability";

interface InfoRequest extends AuthRequest {
  firstName?: string;
  lastName?: string;
  about?: string;
  interests?: string[];
  website?: string;
}

export const updateBasicInfo = async (
  req: InfoRequest,
  res: Response,
): Promise<any> => {
  const authUserId = req.user?.id;

  if (!authUserId) {
    return res.status(401).json({
      message: "Unauthorized access",
      status: "ERROR",
      payload: null,
    });
  }

  const { firstName, lastName, about, interests, website } = req.body;

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
    // If the name is being updated, we check the new identity signals
    if (firstName || lastName) {
      const updatedFirstName = firstName || user.firstName;
      const updatedLastName = lastName || user.lastName;
      const fullName = `${updatedFirstName} ${updatedLastName}`;

      const notability = await evaluateNotability(
        fullName,
        user.email,
        user.phoneNumber || undefined,
      );

      // Update notability flags based on the new name
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

    await user.save();

    const safePayload = user.toObject();

    // Clean sensitive fields
    userSensitiveFields().forEach((field) => {
      delete (safePayload as any)[field];
    });

    return res.status(200).json({
      message: "User basic details updated successfully",
      status: "SUCCESS",
      payload: safePayload,
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
