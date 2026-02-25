// lib/shared-config.js (or in a shared internal package)
import { withMicrofrontends } from "@vercel/microfrontends/next/config";

export function withCommonConfig(appConfig = {}) {
  const commonConfig = {
    ...appConfig,
    async rewrites() {
      // Get existing rewrites if any
      const baseRewrites = appConfig.rewrites
        ? await appConfig.rewrites()
        : { beforeFiles: [] };

      // Ensure we handle both array and object return types from the base
      const beforeFiles = Array.isArray(baseRewrites)
        ? []
        : baseRewrites.beforeFiles || [];

      return {
        ...baseRewrites,
        beforeFiles: [
          ...beforeFiles,
          {
            source: "/api/:path*",
            destination: `${process.env.BACKEND_API_URL}/:path*`,
          },
        ],
      };
    },
  };

  return withMicrofrontends(commonConfig);
}
