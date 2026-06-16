"use client";

export interface Language {
  title: string;
  iso: string;
  flag?: string;
}

export const LANGUAGES: Language[] = [
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
];

export const SUPPORTED_ISO_CODES: string[] = LANGUAGES.map((lang) => lang.iso);
