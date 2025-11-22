import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

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

const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
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
      payload: JwtPayload | string | undefined
    ) => {
      if (err || typeof payload !== "object" || !("id" in payload)) {
        return res
          .status(403)
          .json({ message: "Invalid token", status: "FORBIDDEN" });
      }

      req.user = payload as JwtUserPayload; //attach user data to the request
      next();
    }
  );
};

export default verifyToken;
