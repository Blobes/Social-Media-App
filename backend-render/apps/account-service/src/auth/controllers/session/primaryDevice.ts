import { UserModel } from "@repo/database";
import { IAuthRequest } from "@repo/shared";
import { Response } from "express";

export const setPrimaryDevice = async (
  req: IAuthRequest,
  res: Response,
): Promise<any> => {
  const userId = req.user?.id;
  const targetSessionId = req.body.sessionId; // The ID from the 'getActiveSessions' list

  if (!userId || !targetSessionId) {
    return res.status(400).json({
      status: "ERROR",
      message: "User ID and Session ID are required.",
    });
  }

  try {
    // Update the user's primary session record in MongoDB
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { primarySessionId: targetSessionId },
      { new: true },
    );

    if (!user) {
      return res
        .status(404)
        .json({ status: "ERROR", message: "User not found." });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "This device has been set as your primary device.",
      payload: { primarySessionId: user.primarySessionId },
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ status: "ERROR", message: "Internal server error." });
  }
};
