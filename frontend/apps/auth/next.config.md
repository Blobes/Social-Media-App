import NextFederationPlugin from "@module-federation/nextjs-mf";
const sharedDeps = require("../../shared-federation.config.js");

const nextConfig = {
  webpack(config, options) {
    config.plugins.push(
      new NextFederationPlugin({
        name: "auth",
        filename: "static/chunks/remoteEntry.js",
        exposes: {
          "./AuthModule": "./src/app/AuthWrapper.tsx",
          "./Login": "./src/app/login/Login.tsx",
        },
        shared: sharedDeps,
      }),
    );
    return config;
  },
};

export default nextConfig;
