// 1. Define allowed formats
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime", // .mov
  "image/gif",
] as const;

// 2. Define size limits (100MB)
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

// 3. Helper to get extension from mime type (useful for S3 keys)
export const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "image/gif": "gif",
};

// Create a type from the array for strict TypeScript checking
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

const ISO_MAP: Record<string, string> = {
  eng: "en",
  spa: "es",
  fra: "fr",
  deu: "de",
  ita: "it",
  por: "pt",
  cmn: "zh", // Mandarin / Chinese
  jpn: "ja",
  arb: "ar",
  rus: "ru",
};
/**
 * Converts a 3-letter language code to a 2-letter fallback code.
 */
export const to2ISOCode = (threeLetterCode: string): string => {
  return ISO_MAP[threeLetterCode] || "en"; // Default fallback to English if text is ambiguous
};

// African country calling code prefixes (digits only)
export const africanCountryCodes = [
  // West Africa
  "234", // Nigeria
  "233", // Ghana
  "225", // Ivory Coast
  "221", // Senegal
  "231", // Liberia
  "232", // Sierra Leone
  "228", // Togo
  "229", // Benin
  "226", // Burkina Faso
  "220", // Gambia
  "224", // Guinea
  "245", // Guinea-Bissau
  "223", // Mali
  "227", // Niger
  "238", // Cape Verde

  // East Africa
  "254", // Kenya
  "256", // Uganda
  "255", // Tanzania
  "250", // Rwanda
  "251", // Ethiopia
  "257", // Burundi
  "252", // Somalia
  "211", // South Sudan
  "253", // Djibouti
  "269", // Comoros
  "230", // Mauritius
  "248", // Seychelles

  // Southern Africa
  "27", // South Africa
  "260", // Zambia
  "263", // Zimbabwe
  "267", // Botswana
  "264", // Namibia
  "265", // Malawi
  "258", // Mozambique
  "266", // Lesotho
  "268", // Eswatini

  // Central Africa
  "237", // Cameroon
  "242", // Republic of the Congo
  "243", // Democratic Republic of the Congo
  "241", // Gabon
  "235", // Chad
  "236", // Central African Republic
  "240", // Equatorial Guinea
  "239", // São Tomé and Príncipe

  // North Africa
  "20", // Egypt
  "212", // Morocco
  "213", // Algeria
  "216", // Tunisia
  "218", // Libya
  "249", // Sudan
];

export const globalCountryCodes = [
  "1", // United States / Canada
  "91", // India
  "55", // Brazil
  "52", // Mexico
  "57", // Colombia
  "62", // Indonesia
  "63", // Philippines
  "44", // United Kingdom
  "86", // China
  "82", // South Korea
];
