import { NextFunction, Response } from "express";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { updateAccountDemoInfo } from "@/user/services/profile/info";

interface DemoRequest extends IAuthRequest {
  body: {
    gender?: string;
    dateOfBirth?: string;
    location?: string;
    relationship?: string;
  };
}

/**
 * Controller endpoint to modify contextual background identities and clear profile lookup entries.
 */
export const updateDemoInfo = async (
  req: DemoRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  const authUserId = req.user?.id;
  const { gender, dateOfBirth, location, relationship } = req.body;

  if (!authUserId) {
    return res.status(401).json({
      status: "ERROR",
      ...MESSAGES_REGISTRY.AUTH.UNAUTHORIZED,
      payload: null,
    });
  }

  try {
    const serviceResult = await updateAccountDemoInfo({
      authUserId,
      gender,
      dateOfBirth,
      location,
      relationship,
    });

    if (serviceResult.status === "NOT_FOUND") {
      return res.status(404).json({
        status: "ERROR",
        ...serviceResult.transInfo,
        payload: null,
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      ...serviceResult.transInfo,
      payload: serviceResult.payload,
    });
  } catch (error: any) {
    console.error("Update Demo Error:", error);
    return forwardError(
      next,
      MESSAGES_REGISTRY.PROFILE.UPDATE_DEMO_ERROR,
      error,
    );
  }
};
