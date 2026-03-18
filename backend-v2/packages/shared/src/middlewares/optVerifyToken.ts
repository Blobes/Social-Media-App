import { Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { IAuthRequest, IJwtUser } from "../types/types";

export const optVerifyToken: RequestHandler = (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.access_token;

  if (!token) {
    // No token just continue as guest
    next();
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET as string,
    (err: jwt.VerifyErrors | null, payload: unknown) => {
      if (!err) {
        req.user = payload as IJwtUser; // attach user if valid
      }
      // If invalid, just continue as guest (do not block)
      next();
    },
  );
};
