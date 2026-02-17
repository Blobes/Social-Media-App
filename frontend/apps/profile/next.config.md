import NextFederationPlugin from "@module-federation/nextjs-mf";
const sharedDeps = require("../../shared-federation.config.js");

const nextConfig = {
  webpack(config, options) {
    config.plugins.push(
      new NextFederationPlugin({
        name: "profile",
        filename: "static/chunks/remoteEntry.js",
        exposes: {
          "./useUser": "./src/app/useUser.ts",
        },
        shared: sharedDeps,
      }),
    );
    return config;
  },
};

export default nextConfig;
