import dotenv from "dotenv";
import path from "path";

export function loadEnv(serviceName: string) {
  const rootEnvPath = path.resolve(process.cwd(), "../../.env.development");
  const serviceEnvPath = path.resolve(process.cwd(), "../../.env.production");

  // 1. Load base env (non-sensitive defaults)
  const rootResult = dotenv.config({ path: rootEnvPath });

  if (rootResult.error) {
    console.warn(`⚠️ Root env not found at ${rootEnvPath} (this may be okay)`);
  } else {
    console.log(`✅ Loaded root env: ${rootEnvPath}`);
  }

  // 2. Load service-specific secrets (OVERRIDES root)
  const serviceResult = dotenv.config({
    path: serviceEnvPath,
    override: false, // 🔥 THIS IS THE KEY
  });

  if (serviceResult.error) {
    throw new Error(
      `❌ Failed to load env for ${serviceName} at ${serviceEnvPath}`,
    );
  }

  console.log(`✅ Loaded service env: ${serviceEnvPath}`);
}

export const getEnv = (key: string, required = true): string => {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }
  return value as string;
};
