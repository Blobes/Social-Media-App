import dotenv from "dotenv";
import path from "path";

/**
 * Loads the environment variables from the project root.
 */
export function loadEnv(is3LevelDeep: boolean = false) {
  const pathDepth = is3LevelDeep ? "../../../" : "../../";
  const baseEnvPath = path.resolve(
    process.cwd(),
    `${pathDepth}.env.development`,
  );
  const prodEnvPath = path.resolve(
    process.cwd(),
    `${pathDepth}.env.production`,
  );

  // Load development defaults
  dotenv.config({ path: baseEnvPath });

  // 2. Load production values ONLY if the key doesn't exist yet
  const result = dotenv.config({
    path: prodEnvPath,
    override: false,
  });

  if (result.error) {
    console.warn(`⚠️ Production env file not found at ${prodEnvPath}`);
  } else {
    console.log(`✅ Loaded environment configuration (Non-overriding mode)`);
  }
}

export const getEnv = (key: string, required = true): string => {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }
  return value as string;
};
