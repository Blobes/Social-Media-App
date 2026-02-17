import NextFederationPlugin from "@module-federation/nextjs-mf";

const nextConfig = {
  webpack(config, options) {
    config.plugins.push(
      new NextFederationPlugin({
        name: "website",
        filename: "static/chunks/remoteEntry.js",
        exposes: {
          "./WebsiteModule": "./src/app/WebsiteHub.tsx",
        },
        shared: {
          react: { singleton: true },
          "react-dom": { singleton: true },
          "@mui/material": { singleton: true },
        },
      }),
    );
    return config;
  },
};

export default nextConfig;
