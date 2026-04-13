"use client";

import { ICountryItem } from "../types/ui-props";

export const COUNTRIES: Record<string, ICountryItem> = {
  NG: { name: "Nigeria", code: "+234", iso: "NG", flag: "🇳🇬" },
  GH: { name: "Ghana", code: "+233", iso: "GH", flag: "🇬🇭" },
  KE: { name: "Kenya", code: "+254", iso: "KE", flag: "🇰🇪" },
  ZA: { name: "South Africa", code: "+27", iso: "ZA", flag: "🇿🇦" },
  GB: { name: "United Kingdom", code: "+44", iso: "GB", flag: "🇬🇧" },
  US: { name: "United States", code: "+1", iso: "US", flag: "🇺🇸" },
  CA: { name: "Canada", code: "+1", iso: "CA", flag: "🇨🇦" },
  AE: { name: "United Arab Emirates", code: "+971", iso: "AE", flag: "🇦🇪" },
  FR: { name: "France", code: "+33", iso: "FR", flag: "🇫🇷" },
  DE: { name: "Germany", code: "+49", iso: "DE", flag: "🇩🇪" },
};
