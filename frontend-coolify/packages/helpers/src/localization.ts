"use client";

import i18n, { i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

const CDN_HOST = process.env.CLOUDFLARE_UPLOAD_HOST;

/**
 * Generates an isolated i18n runtime context tailored for independent micro frontend spaces.
 */
export const initializeLocalization = async (
  namespace: string,
  initialLng: string = "en",
  supportedLanguages: string[],
): Promise<I18nInstance> => {
  const instance = i18n.createInstance();

  await instance
    .use(HttpBackend)
    .use(initReactI18next)
    .init({
      lng: initialLng,
      fallbackLng: "en",
      ns: [namespace], // Load both namespace and common
      defaultNS: namespace, // Default to the app's namespace
      supportedLngs: supportedLanguages,
      interpolation: {
        escapeValue: true,
      },
      backend: {
        loadPath: `${CDN_HOST}/locales/{{lng}}/{{ns}}.json`,
      },
      react: {
        useSuspense: false,
      },
    });

  return instance;
};
