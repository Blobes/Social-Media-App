import { withBaseConfig } from "@repo/core/next-config";

const nextConfig = {
  assetPrefix: "/post-assets",
};

export default withBaseConfig(nextConfig, "https://api.funstakes.net", "post");
