import { OtpType } from "../../types/types";

/**
 * Calculates a dynamic threshold based on post popularity.
 * Formula: Base + Log10(Views) * Multiplier
 * This ensures the threshold grows slower than the view count.
 */
export const calculateThreshold = (viewCount: number = 0): number => {
  const BASE_THRESHOLD = 5;
  const MULTIPLIER = 6;
  const MAX_CEILING = 50; // No post should require more than 50 unique reports

  if (viewCount < 100) return BASE_THRESHOLD;

  // Math.log10(100) = 2 -> (2 * 6) + 5 = 17
  // Math.log10(100,000) = 5 -> (5 * 6) + 5 = 35
  const dynamicValue =
    BASE_THRESHOLD + Math.floor(Math.log10(viewCount) * MULTIPLIER);

  return Math.min(dynamicValue, MAX_CEILING);
};

/**
 * Calculates internal score based on followers and engagement velocity
 */
export const calculateMeritScore = (
  followerCount: number,
  accountAgeInDays: number,
): number => {
  // Logic: Merit score = (Followers / Days Active)
  // We use Math.max to avoid division by zero
  const velocity = followerCount / (accountAgeInDays || 1);
  return velocity;
};

/**
 * Resolves destination type from the raw identifier string.
 */
export const setOtpChannel = (value: string): OtpType | null => {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^\+?[\d\s-]{10,}$/;

  if (EMAIL_REGEX.test(value)) return "EMAIL";
  if (PHONE_REGEX.test(value)) return "PHONE";
  return null;
};
