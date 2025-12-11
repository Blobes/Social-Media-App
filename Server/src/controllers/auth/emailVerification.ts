import { hashCode } from "@/helper";
import { UserModel } from "@/models";
import { Request, Response } from "express";

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { email, code } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  if (!user.verificationCode || !user.verificationExpiry)
    return res.status(400).json({ message: "No verification requested" });

  if (Date.now() > user.verificationExpiry.getTime())
    return res.status(400).json({ message: "Code expired" });

  const hashed = hashCode(code);

  if (hashed !== user.verificationCode)
    return res.status(400).json({ message: "Invalid verification code" });

  // Success
  user.isEmailVerified = true;
  user.verificationCode = undefined;
  user.verificationExpiry = undefined;
  await user.save();

  res.json({ message: "Email verified successfully" });
};
