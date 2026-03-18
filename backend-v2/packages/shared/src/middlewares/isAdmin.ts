import { Response, NextFunction } from "express";
import { IAuthRequest } from "../types/types";

export const isAdmin = (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
) => {
  // Assuming your verifyAuthToken middleware attaches the user role to req.user
  if (req.user && req.user.role === "ADMIN") {
    return next();
  }

  res.status(403).json({
    status: "ERROR",
    message: "Access denied. Administrative privileges required.",
  });
  return;
};
