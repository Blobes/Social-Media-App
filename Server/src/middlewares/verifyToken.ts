import jwt, { JwtPayload } from "jsonwebtoken";

import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: JwtPayload | string;
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
      if (err)
        return res
          .status(403)
          .json({ message: "Invalid token", status: "FORBIDDEN" });

      req.user = payload; //attach user data to the request
      next();
    }
  );
};

export default verifyToken;
