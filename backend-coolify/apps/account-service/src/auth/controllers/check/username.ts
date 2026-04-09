import { UserModel } from "@repo/database";
import { Request, Response } from "express";

interface CheckUsernameRequest extends Request {
  body: {
    username?: string;
    usedFor?: "REGISTRATION" | "LOGIN";
  };
}

export const checkUsername = async (
  req: CheckUsernameRequest,
  res: Response,
): Promise<any> => {
  const { username, usedFor = "REGISTRATION" } = req.body;

  if (!username) {
    return res.status(400).json({
      status: "ERROR",
      message: "Username is required",
      payload: null,
    });
  }

  try {
    const formattedUsername = username.trim();

    // Find the user (including deactivated ones) to check status
    const existingUser = await UserModel.findOne({
      username: { $regex: new RegExp(`^${formattedUsername}$`, "i") },
    }).setOptions({ skipFilter: true });

    // Logic for LOGIN purpose
    if (usedFor === "LOGIN") {
      if (!existingUser) {
        return res.status(404).json({
          status: "ERROR",
          message: "Username not found.",
          payload: null,
        });
      }

      if (existingUser.isDeactivated) {
        return res.status(200).json({
          status: "SUCCESS",
          isExisting: true,
          message: "This account is deactivated. Please restore it to log in.",
          payload: {
            accountStatus: "DEACTIVATED",
            _id: existingUser._id,
            username: existingUser.username,
          },
        });
      }

      return res.status(200).json({
        status: "SUCCESS",
        isExisting: true,
        message: "Username exists and is active.",
        payload: {
          accountStatus: "ACTIVE",
          userId: existingUser._id,
          username: existingUser.username,
        },
      });
    }

    // Logic for REGISTRATION/UPDATE purpose (Default)
    if (!existingUser) {
      return res.status(200).json({
        status: "SUCCESS",
        isExisting: false,
        message: "Username is available",
        payload: null,
      });
    }

    // Generate suggestions if taken (including deactivated handles)
    const suggestions: string[] = [];
    const maxSuggestions = 5;

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
    while (suggestions.length < maxSuggestions) {
      const candidate = `${formattedUsername}${counter}`;
      if (!takenSet.has(candidate.toLowerCase())) {
        suggestions.push(candidate);
      }
      counter++;
      if (counter > 100) break;
    }

    return res.status(200).json({
      status: "SUCCESS",
      isExisting: true,
      suggestions,
      message: "Username is already taken.",
      payload: null,
    });
  } catch (error: any) {
    console.error("Username Check Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: error.message || "Internal server error",
      payload: null,
    });
  }
};
