import { Request, Response } from "express";

const logoutUser = (req: Request, res: Response) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",

    path: "/",
  });
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  res.status(200).json({ message: "Logged out successfully" });
};
export default logoutUser;
