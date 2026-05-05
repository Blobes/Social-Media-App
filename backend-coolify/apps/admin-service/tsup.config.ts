import { defineConfig } from "tsup";
import type { Format } from "tsup";
import { baseConfig } from "@repo/shared";
/**
 * Gateway build config extending the base monorepo config.
 */
export default defineConfig({
  ...baseConfig,
  format: baseConfig.format as Format[],
  entry: ["src/index.ts"],
  external: [],
});
