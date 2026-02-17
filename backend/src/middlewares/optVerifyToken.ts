import { Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JwtUserPayload } from "./verifyAuthToken";

export const optVerifyToken: RequestHandler = (
  req: AuthRequest,
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
        req.user = payload as JwtUserPayload; // attach user if valid
      }
      // If invalid, just continue as guest (do not block)
      next();
    },
  );
};

//&& typeof payload === "object" && payload && "id" in payload
