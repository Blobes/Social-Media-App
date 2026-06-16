import { defineConfig } from "i18next-cli";

/**
 * Generates a complete i18next-cli configuration object for a specific application or package domain.
 */
export function createI18nConfig(namespace = "common") {
  return defineConfig({
    locales: ["en"],
    extract: {
      output: `packages/core/locales/{{language}}/{{namespace}}.json`,
      input: ["packages/**/*.{ts,tsx,js,jsx}"],
      ignore: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/*.d.ts"],
      defaultNS: namespace,
      sort: true,
      transComponents: ["StaticText"],
      useTranslationNames: ["useTranslation"],
      removeUnusedKeys: false,
    },
  });
}

export default createI18nConfig();
