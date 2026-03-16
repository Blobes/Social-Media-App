import { withMicrofrontends } from "@vercel/microfrontends/next/config";

export function withBaseConfig(appConfig = {}, backendApi) {
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
            destination: `${backendApi}/:path*`,
          },
        ],
      };
    },
  });
}
