import { Request, Response } from "express";

const logoutUser = (req: Request, res: Response) => {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/auth/refresh" });
  res.status(200).json({ message: "Logged out successfully" });
};
export default logoutUser;
