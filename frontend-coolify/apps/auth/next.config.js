import { withBaseConfig } from "@repo/core/next-config";

const nextConfig = {
  // assetPrefix: "/auth-assets",
};

export default withBaseConfig(nextConfig, "https://api.funstakes.net", "auth");
