import dotenv from "dotenv";
import path from "path";
import fs from "fs";

/**
 * Automatically loads the correct .env file from the monorepo root.
 * We use a relative path logic that knows shared is in packages/shared
 * and needs to look 2 levels up to find the root.
 */
export const initEnv = () => {
  const envMode = process.env.NODE_ENV || "development";
  const envFile = `.env.${envMode}`;
  const envPath = path.resolve(process.cwd(), "../../", envFile);

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    // // Explicitly set the process variable so the rest of the app sees it
    // process.env.NODE_ENV = envMode;
    console.log(`📡 Environment initialized: ${envFile}`);
  } else {
    console.error(`❌ Critical: Could not find ${envFile}`);
    // process.exit(1);
  }
};
