import jwt, { JwtPayload } from "jsonwebtoken";
import { RequestHandler, Response } from "express";
import { genAccessTokens } from "@/helper";
import { AuthRequest } from "./verifyAuthToken";

export const refreshAuthToken: RequestHandler = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    res.status(401).json({
      message: "No refresh token provided",
      status: "UNAUTHORIZED",
    });
    return;
  }

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string,
    ) as JwtPayload;
    const user = { _id: payload.id };
    genAccessTokens(user, req, res);

    res.status(200).json({ message: "Token refreshed successfully" });
    return;
  } catch (err) {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    res.status(401).json({
      message: "Expired or invalid refresh token",
      status: "UNAUTHORIZED",
    });
    return;
  }
};
