import { defineConfig } from "i18next-cli";
import { createI18nConfig } from "../../i18next.config.js";

const baseConfig = createI18nConfig("auth");
export default defineConfig({
  ...baseConfig,
  extract: {
    ...baseConfig.extract,
    output: `../../packages/core/locales/{{language}}/{{namespace}}.json`,
    input: ["./app/**/*.{ts,tsx,js,jsx}"],
    defaultNS: "auth",
  },
});
