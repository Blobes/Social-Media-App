import verifyToken from "@/middlewares/verifyToken";
import { Request, Response } from "express";
import { UserModel } from "@/models";

const verifyUser = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const user = await UserModel.findById(userId).select("-password");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({ user });
};

export default [verifyToken, verifyUser];
