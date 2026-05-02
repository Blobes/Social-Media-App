import { UserModel } from "@repo/database";
import { evaluateDeviceTrust, resolveDevice } from "@repo/shared";
import { Request, Response } from "express";

interface CheckUsernameRequest extends Request {
  body: {
    username?: string;
    usedFor?: "REGISTRATION" | "LOGIN";
  };
}

/**
 * Checks username availability for registration or trust status for login.
 */
export const checkUsername = async (
  req: CheckUsernameRequest,
  res: Response,
): Promise<void> => {
  const { username, usedFor = "REGISTRATION" } = req.body;

  if (!username) {
    res.status(400).json({
      status: "ERROR",
      message: "Username is required",
      payload: null,
    });
    return;
  }

  try {
    const formattedUsername = username.trim();

    const existingUser = await UserModel.findOne({
      username: { $regex: new RegExp(`^${formattedUsername}$`, "i") },
    }).setOptions({ skipFilter: true });

    // ── LOGIN flow ──────────────────────────────────────────────────────────
    if (usedFor === "LOGIN") {
      if (!existingUser) {
        res.status(404).json({
          status: "ERROR",
          message: "Username not found.",
          payload: null,
        });
        return;
      }

      if (existingUser.isDeactivated) {
        res.status(200).json({
          status: "SUCCESS",
          isExisting: true,
          message: "This account is deactivated. Please restore it to log in.",
          payload: {
            accountStatus: "DEACTIVATED",
            userId: existingUser._id,
            username: existingUser.username,
            firstName: existingUser.firstName,
            email: existingUser.email,
            phone: existingUser.phoneNumber,
          },
        });
        return;
      }

      // New device trust evaluation
      const deviceToken = req.cookies["device_token"];
      const device = await resolveDevice(existingUser._id, deviceToken, req);
      const trust = await evaluateDeviceTrust(device);

      const isVerified =
        existingUser.isEmailVerified || existingUser.isPhoneVerified;
      const isOnboarded =
        existingUser.onboardingStep === null && existingUser.isOnboarded;

      res.status(200).json({
        status: "SUCCESS",
        message: "Username exists and is active.",
        isExisting: true,
        isOnboarded,
        isVerified,
        needsVerification: !trust.trusted,
        payload: {
          accountStatus: "ACTIVE",
          trustReason: trust.reason,
          userId: existingUser._id,
          username: existingUser.username,
          firstName: existingUser.firstName,
          email: existingUser.email,
          phone: existingUser.phoneNumber,
        },
      });
      return;
    }

    // ── REGISTRATION flow ───────────────────────────────────────────────────
    if (!existingUser) {
      res.status(200).json({
        status: "SUCCESS",
        isExisting: false,
        message: "Username is available",
        payload: null,
      });
      return;
    }

    // Logic for generating suggestions if username is taken
    const suggestions: string[] = [];
    const regex = new RegExp(`^${formattedUsername}\\d*$`, "i");

    const taken = await UserModel.find({ username: regex })
      .select("username -_id")
      .setOptions({ skipFilter: true })
      .lean();

    const takenSet = new Set(
      taken
        .map((u) => u.username)
        .filter((name): name is string => typeof name === "string")
        .map((name) => name.toLowerCase()),
    );

    let counter = 1;
    while (suggestions.length < 5) {
      const candidate = `${formattedUsername}${counter}`;
      if (!takenSet.has(candidate.toLowerCase())) suggestions.push(candidate);
      counter++;
      if (counter > 100) break;
    }

    res.status(200).json({
      status: "SUCCESS",
      isExisting: true,
      suggestions,
      message: "Username is already taken.",
      payload: null,
    });
  } catch (error) {
    console.error("[checkUsername] Error:", error);
    res.status(500).json({
      status: "ERROR",
      message: error instanceof Error ? error.message : "Internal server error",
      payload: null,
    });
  }
};
