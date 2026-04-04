import { Request } from "express";

/**
 * Fetches location data using ip-api.com.
 */
export async function getLocationFromIp(ip: string | undefined) {
  // 1. Guard against local/internal IPs
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip === "localhost") {
    return null;
  }

  try {
    // We use the JSON endpoint with specific fields to match your needs
    const fields = "status,message,country,regionName,city,isp,lat,lon";
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=${fields}`,
    );

    if (!response.ok) {
      console.error(`Geo API HTTP Error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as any;

    if (data.status !== "success") {
      console.warn("IP lookup logic failure:", data.message);
      return null;
    }

    return {
      country: data.country,
      state: data.regionName,
      city: data.city,
      isp: data.isp,
      latitude: data.lat,
      longitude: data.lon,
      flag: null, // ip-api free tier does not provide emojis
    };
  } catch (err: any) {
    console.error("Geo Network Error:", err.message);
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

export const generateRandomIp = () => {
  const rand = () => Math.floor(Math.random() * 256); // 0–255
  return `${rand()}.${rand()}.${rand()}.${rand()}`;
};

export const generateTestEmail = (email: string): string => {
  const [username, domain] = email.split("@");
  const randomNumber = Math.floor(1000 + Math.random() * 9000); // random 4-digit
  return `${username}${randomNumber}@${domain}`;
};
