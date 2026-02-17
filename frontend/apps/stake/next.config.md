import NextFederationPlugin from "@module-federation/nextjs-mf";
const sharedDeps = require("../../shared-federation.config.js");

const nextConfig = {
  webpack(config, options) {
    config.plugins.push(
      new NextFederationPlugin({
        name: "stake",
        filename: "static/chunks/remoteEntry.js",
        exposes: {
          // Expose the main Gist component
          "./StakeModule": "./src/app/StakeCard.tsx",
          "./StakeCard": "./src/app/StakeCard.tsx",
          "./useStake": "./src/app/useStake.ts",
        },
        shared: sharedDeps,
      }),
    );
    return config;
  },
};

export default nextConfig;
