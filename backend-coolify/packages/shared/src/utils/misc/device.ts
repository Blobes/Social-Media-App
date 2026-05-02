import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

interface RiskFactors {
  isNewDevice: boolean;
  isIpChange: boolean;
  isGeoChange: boolean;
}

type RiskLevel = "BLOCK" | "VERIFY" | "ALLOW";

/**
 * Retrieves the device token from cookies or initializes a new one if missing.
 */
export const getOrSetDeviceToken = (req: Request, res: Response): string => {
  let token = req.cookies.device_token;

  if (!token) {
    token = uuidv4();
    res.cookie("device_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year persistence
    });
  }
  return token;
};

/**
 * Calculates a security risk score based on hardware and network heuristics.
 */
export const computeRisk = ({
  isNewDevice,
  isIpChange,
  isGeoChange,
}: RiskFactors): RiskLevel => {
  let score = 0;

  if (isNewDevice) score += 50;
  if (isIpChange) score += 20;
  if (isGeoChange) score += 40;

  if (score >= 70) return "BLOCK";
  if (score >= 40) return "VERIFY";

  return "ALLOW";
};
