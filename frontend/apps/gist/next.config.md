import NextFederationPlugin from "@module-federation/nextjs-mf";
const sharedDeps = require("../../shared-federation.config.js");

const nextConfig = {
  webpack(config, options) {
    config.plugins.push(
      new NextFederationPlugin({
        name: "gist",
        filename: "static/chunks/remoteEntry.js",
        remotes: {
          auth: `auth@http://localhost:3001/_next/static/${isServer ? "ssr" : "chunks"}/remoteEntry.js`,
        },
        exposes: {
          // Expose the main Gist component
          "./GistModule": "./src/app/gist/Gists.tsx",
          "./GistCard": "./src/components/GistCard.tsx",
          "./useGists": "./src/hooks/useGists.ts",
          "./useGists": "./src/hooks/useGists.ts",
        },
        shared: sharedDeps,
      }),
    );
    return config;
  },
};

export default nextConfig;
