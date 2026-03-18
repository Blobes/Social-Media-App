import jwt, { JwtPayload } from "jsonwebtoken";
import { Response, NextFunction, RequestHandler } from "express";
import { IAuthRequest, IJwtUser } from "../types/types";

export const verifyAuthToken: RequestHandler = (
  req: IAuthRequest,
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

      req.user = payload as IJwtUser; //attach user data to the request
      next();
    },
  );
};
