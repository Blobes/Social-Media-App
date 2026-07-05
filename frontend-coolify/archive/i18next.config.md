import { createI18nConfig } from "../../locale/i18next.config.js";
import { defineConfig } from "i18next-cli";

const baseConfig = createI18nConfig("shell");
export default defineConfig({
...baseConfig,
extract: {
...baseConfig.extract,
output: `../../locale/versions/{{language}}/{{namespace}}.json`,
input: ["./app/**/*.{ts,tsx,js,jsx}"],
defaultNS: "shell",
},
});

import { defineConfig } from "i18next-cli";
import { createI18nConfig } from "../../locale/i18next.config.js";

const baseConfig = createI18nConfig("helpers");
export default defineConfig({
...baseConfig,
extract: {
...baseConfig.extract,
output: `../../locale/versions/{{language}}/{{namespace}}.json`,
input: ["./src/**/*.{ts,tsx,js,jsx}"],
ignore: [...(baseConfig.extract?.ignore || []), "\*\*/apiClient.ts"],
defaultNS: "helpers",
},
});

import { defineConfig } from "i18next-cli";
import path from "path";

/\*\*

- Generates a complete i18next-cli configuration object for a specific application or package domain.
  _/
  export function createI18nConfig(namespace = "common") {
  // Resolve base workspace directories explicitly to survive execution environment root changes
  const baseLocalesDir = path.join(import.meta.dirname);
  const monorepoRoot = path.resolve(baseLocalesDir, "..");
  const searchTargetPattern = path.join(
  monorepoRoot,
  "packages/\*\*/_.{ts,tsx,js,jsx}",
  );
  const outputPattern = path.join(
  baseLocalesDir,
  "versions/{{language}}/{{namespace}}.json",
  );

return defineConfig({
locales: ["en"],
extract: {
output: outputPattern,
input: [searchTargetPattern],
ignore: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/*.d.ts"],
defaultNS: namespace,
sort: true,
transComponents: ["TransText"],
useTranslationNames: ["useTranslation"],
removeUnusedKeys: false,
},
});
}

export default createI18nConfig();

"i18n:extract:root": "i18next-cli extract --config locale/i18next.config.ts",
"i18n:extract:apps": "pnpm -r --filter='./apps/_' exec i18next-cli extract",
"i18n:extract:helpers": "pnpm -r --filter='./packages/helpers/_' exec i18next-cli extract",
"i18n:extract": "pnpm run i18n:extract:root && pnpm run i18n:extract:apps && pnpm run i18n:extract:helpers",
"i18n:sync": "pnpm run i18n:extract && pnpm run i18n:translate",
