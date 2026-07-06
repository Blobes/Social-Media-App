"use client";

export interface Language {
  title: string;
  iso: string;
  flag?: string;
}

export const LANGUAGES = [
  { title: "English", iso: "en", flag: "🇬🇧" },
  { title: "Español", iso: "es", flag: "🇪🇸" },
  { title: "Français", iso: "fr", flag: "🇫🇷" },
  { title: "Deutsch", iso: "de", flag: "🇩🇪" },
  { title: "Italiano", iso: "it", flag: "🇮🇹" },
  { title: "Português", iso: "pt", flag: "🇵🇹" },
  { title: "中文", iso: "zh", flag: "🇨🇳" },
  { title: "日本語", iso: "ja", flag: "🇯🇵" },
  { title: "العربية", iso: "ar", flag: "🇸🇦" },
  { title: "Русский", iso: "ru", flag: "🇷🇺" },
] as const satisfies readonly Language[];

export type SupportedIsoCode = (typeof LANGUAGES)[number]["iso"];

export const SUPPORTED_ISO_CODES: SupportedIsoCode[] = LANGUAGES.map(
  (lang) => lang.iso,
);
