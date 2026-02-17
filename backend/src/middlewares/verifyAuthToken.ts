import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction, RequestHandler } from "express";

export interface JwtUserPayload {
  id: any;
  email?: string;
  username?: string;
  isAdmin: boolean;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthRequest extends Request {
  user?: JwtUserPayload;
}

const verifyAuthToken: RequestHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.access_token;

  if (!token) {
    res
      .status(401)
      .json({ message: "No token provided", status: "UNAUTHORIZED" });
    return;
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET as string,
    (
      err: jwt.VerifyErrors | null,
      payload: JwtPayload | string | undefined,
    ) => {
      if (err) {
        res
          .status(401)
          .json({ message: "Invalid token", status: "UNAUTHORIZED" });
        return;
      }

      req.user = payload as JwtUserPayload; //attach user data to the request
      next();
    },
  );
};

export default verifyAuthToken;
