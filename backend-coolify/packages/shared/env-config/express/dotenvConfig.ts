import dotenv from "dotenv";
import path from "path";

/**
 * Automatically loads the correct .env file from the monorepo root.
 * We use a relative path logic that knows shared is in packages/shared
 * and needs to look 2 levels up to find the root.
 */
// export const initEnv = (env: string) => {
//   const envMode = env || "development";
//   const envFile = `.env.${envMode}`;
//   const envPath = path.resolve(process.cwd(), "../../", envFile);

//   if (fs.existsSync(envPath)) {
//     dotenv.config({ path: envPath });
//     // // Explicitly set the process variable so the rest of the app sees it
//     console.log(`📡 Environment initialized: ${envFile}`);
//   } else {
//     console.error(`❌ Critical: Could not find ${envFile}`);
//   }
// };

export function loadEnv(serviceName: string) {
  const rootEnvPath = path.resolve(process.cwd(), "../../.env.development");
  const serviceEnvPath = path.resolve(
    process.cwd(),
    `../../secrets/.env.${serviceName}`,
  );

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
    override: true, // 🔥 THIS IS THE KEY
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
