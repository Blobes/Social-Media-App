/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Keep all transpiled packages so CSS/Shared code works across boundaries
  transpilePackages: [
    "@funstakes/helpers",
    "@funstakes/hooks",
    "@funstakes/theme",
    "@funstakes/shared-ui",
    "@funstakes/shared-state",
    "@funstakes/types",
  ],

  // 2. Enable Turbopack-specific configurations
  serverExternalPackages: [],

  // 3. (Optional) If you have images or assets in remote apps,
  // you'll want to whitelist their local dev domains
  images: {
    remotePatterns: [{ protocol: "http", hostname: "localhost" }],
  },
};

export default nextConfig;
