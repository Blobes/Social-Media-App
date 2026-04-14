export function withBaseConfig(appConfig = {}, backendApi) {
  return {
    ...appConfig,
    output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
    async headers() {
      return [
        {
          source: "/_next/:path*",
          headers: [
            { key: "Access-Control-Allow-Origin", value: "*" },
            {
              key: "Access-Control-Allow-Methods",
              value: "GET,OPTIONS,PATCH,POST",
            },
            { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          ],
        },
      ];
    },
    async rewrites() {
      const baseRewrites = appConfig.rewrites
        ? await appConfig.rewrites()
        : { beforeFiles: [], afterFiles: [], fallback: [] };

      // Ensure we handle both array and object rewrite formats
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
  };
}

export function mapAppAssets(apps) {
  return Object.entries(apps)
    .filter(([_, url]) => !!url)
    .map(([name, url]) => ({
      source: `/${name}-assets/_next/:path*`,
      destination: `${url}/_next/:path*`,
    }));
}
