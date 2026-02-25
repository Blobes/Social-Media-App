// packages/env-config/next-config.js
import { withMicrofrontends } from "@vercel/microfrontends/next/config";

export function withCommonConfig(appConfig = {}, backendUrl) {
  return withMicrofrontends({
    ...appConfig,
    async rewrites() {
      const baseRewrites = appConfig.rewrites
        ? await appConfig.rewrites()
        : { beforeFiles: [] };
      const beforeFiles = Array.isArray(baseRewrites)
        ? []
        : baseRewrites.beforeFiles || [];

      return {
        ...baseRewrites,
        beforeFiles: [
          ...beforeFiles,
          {
            source: "/api/:path*",
            destination: `${backendUrl}/:path*`, // Uses the passed-in variable
          },
        ],
      };
    },
  });
}
