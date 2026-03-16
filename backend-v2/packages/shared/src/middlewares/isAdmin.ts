import { Response, NextFunction } from "express";
import { AuthRequest } from "./verifyAuthToken";

export const isAdmin = (
  req: AuthRequest,
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
