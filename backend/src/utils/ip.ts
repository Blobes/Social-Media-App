import { Request } from "express";
import fetch from "node-fetch";

export async function getLocationFromIP(ip: string | undefined) {
  try {
    const response = await fetch(`https://ipwho.is/${ip}`);
    const data = await response.json();

    if (!data.success) return null;

    return {
      country: data.country,
      state: data.region,
      city: data.city,
      isp: data.connection?.isp,
      flag: data.flag?.emoji,
    };
  } catch (err) {
    console.log("Geo error:", err);
    return null;
  }
}

export const getClientIp = (req: Request) => {
  const xff = req.headers["x-forwarded-for"];
  const xRealIp = req.headers["x-real-ip"];

  // Normalize header values that can be string|string[]
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const ip =
    first(xff)?.split(",")[0] || first(xRealIp) || req.socket.remoteAddress;

  return ip;
};

export const generateRandomIP = () => {
  const rand = () => Math.floor(Math.random() * 256); // 0–255
  return `${rand()}.${rand()}.${rand()}.${rand()}`;
};

export const generateTestEmail = (email: string): string => {
  const [username, domain] = email.split("@");
  const randomNumber = Math.floor(1000 + Math.random() * 9000); // random 4-digit
  return `${username}${randomNumber}@${domain}`;
};
