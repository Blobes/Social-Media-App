import { withBaseConfig } from "@repo/core/next-config";

const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  assetPrefix: isProd ? "/post-assets" : undefined,
};

export default withBaseConfig(nextConfig, "https://api.funstakes.net", "post");
