export function withBaseConfig(appConfig = {}, backendApi) {
  return {
    ...appConfig,
    output: "standalone",
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
      // This matches the assetPrefix we set in Step 1
      source: `/_next/static/${name}/_next/static/:path*`,
      destination: `${url}/_next/static/:path*`,
    }));
}
