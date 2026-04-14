import { withBaseConfig } from "@repo/core/next-config";

const isDev = process.env.NODE_ENV === "development";
const nextConfig = {
  assetPrefix: isDev ? "/post-assets" : "https://funstakes.net/post-assets",
};

export default withBaseConfig(nextConfig, "https://api.funstakes.net");
