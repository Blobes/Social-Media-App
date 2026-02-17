import { AuthRequest } from "@/middlewares/verifyAuthToken";
import { RequestHandler, Response } from "express";
import { UserModel } from "@/models";

export const verifyUser: RequestHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  // Now you don't need "as any" because req is typed to have .user
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }

  try {
    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }
    // Always return the response to satisfy the async return type
    res.status(200).json({ user });
    return;
  } catch (error) {
    res.status(500).json({ message: "Server error" });
    return;
  }
};
