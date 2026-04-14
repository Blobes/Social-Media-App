import { withBaseConfig } from "@repo/core/next-config";

const isDev = process.env.NODE_ENV === "development";
const nextConfig = {
  assetPrefix: isDev ? "/auth-assets" : "https://funstakes.net/auth-assets",
};

export default withBaseConfig(nextConfig, "https://api.funstakes.net");
