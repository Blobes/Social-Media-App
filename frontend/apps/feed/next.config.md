import NextFederationPlugin from "@module-federation/nextjs-mf";
import sharedDeps from "../../shared-fed.config.js";

const nextConfig = {
  webpack(config, options) {
    config.plugins.push(
      new NextFederationPlugin({
        name: "feed",
        filename: "static/chunks/remoteEntry.js",
        remotes: {
          gist: `gist@http://localhost:3003/_next/static/${isServer ? "ssr" : "chunks"}/remoteEntry.js`,
          stake: `stake@http://localhost:3005/_next/static/${isServer ? "ssr" : "chunks"}/remoteEntry.js`,
          profile: `profile@http://localhost:3005/_next/static/${isServer ? "ssr" : "chunks"}/remoteEntry.js`,
        },
        exposes: {
          "./FeedModule": "./src/app/online/FeedWrapper.tsx",
          "./OfflineModule": "./src/app/offline/OfflineWrapper.tsx",
        },
        shared: sharedDeps,
      }),
    );
    return config;
  },
};

export default nextConfig;
