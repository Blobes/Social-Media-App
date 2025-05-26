import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response } from "express";

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<any> => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as JwtPayload;

    const newAccessToken = jwt.sign(
      { id: payload.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "15m" }
    );

    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res
      .status(200)
      .json({ message: "Token refreshed", accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Expired or invalid refresh token" });
  }
};
