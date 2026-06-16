import { createI18nConfig } from "../../i18next.config.js";
import { defineConfig } from "i18next-cli";

const baseConfig = createI18nConfig("website");
export default defineConfig({
  ...baseConfig,
  extract: {
    ...baseConfig.extract,
    output: `../../packages/core/locales/{{language}}/{{namespace}}.json`,
    input: ["./app/**/*.{ts,tsx,js,jsx}"],
    defaultNS: "website",
  },
});
