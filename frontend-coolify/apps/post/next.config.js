import { withBaseConfig } from "@repo/core/next-config";

const nextConfig = {
  assetPrefix: "/_next/static/post",
};

export default withBaseConfig(nextConfig, "https://api.funstakes.net");
