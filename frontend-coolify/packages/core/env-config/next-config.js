import fs from "fs";
import path from "path";

/** @type {import('next').NextConfig} */

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve("../../package.json"), "utf8"),
);

/**
 * Generates the foundational configuration block shared across the application architecture.
 */
export function withBaseConfig(appConfig = {}, backendApi, appName) {
  const isProduction = process.env.NODE_ENV === "production";

  const appVersion = isProduction ? packageJson.version : `dev-${Date.now()}`;

  return {
    ...appConfig,
    output: isProduction ? "standalone" : undefined,
    env: { ...appConfig.env, NEXT_PUBLIC_APP_VERSION: appVersion },
    experimental: {
      workerThreads: false,
      cpus: 1,
    },
    webpack(config) {
      // Add .lottie support
      config.module.rules.push({
        test: /\.lottie$/,
        type: "asset/resource",
      });
      // Preserve existing webpack config if provided
      if (typeof appConfig.webpack === "function") {
        return appConfig.webpack(config);
      }
      return config;
    },

    async headers() {
      // Execute and read any headers defined inside the passed appConfig
      const userHeaders =
        typeof appConfig.headers === "function"
          ? await appConfig.headers()
          : [];
      // Define internal global cross-origin isolation parameters
      const baseHeaders = [
        {
          source: "/(.*)",
          headers: [
            {
              key: "Cross-Origin-Opener-Policy",
              value: "same-origin",
            },
            {
              key: "Cross-Origin-Embedder-Policy",
              value: "require-corp",
            },
          ],
        },
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
      return [...baseHeaders, ...userHeaders];
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
            source: `/${appName}-assets/_next/:path*`,
            destination: "/_next/:path*",
          },
          {
            source: "/api/:path*",
            destination: `${backendApi}/:path*`,
          },
        ],
      };
    },
  };
}

/**
 * Maps asset routes to their corresponding multi-zone application targets.
 */
export function mapAppAssets(apps) {
  return Object.entries(apps)
    .filter(([_, url]) => !!url)
    .map(([name, url]) => ({
      source: `/${name}-assets/_next/:path*`,
      destination: `${url}/_next/:path*`,
    }));
}
