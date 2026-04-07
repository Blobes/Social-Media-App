import { withBaseConfig } from "@repo/env-config/next-config";

const nextConfig = {
  async rewrites() {
    const isProd = process.env.NODE_ENV === "production";

    const authUrl =
      process.env.AUTH_URL || isProd
        ? "http://auth-app:3002"
        : "http://localhost:3002";

    const postUrl =
      process.env.POST_URL || isProd
        ? "http://post-app:3003"
        : "http://localhost:3003";

    return {
      afterFiles: [
        // Map the Shell's /login to the Auth Service
        {
          source: "/login",
          destination: `${authUrl}/login`,
        },
        {
          source: "/signup",
          destination: `${authUrl}/signup`,
        },
        // Map everything under /gist to the Post Service
        {
          source: "/gist/:path*",
          destination: `${postUrl}/gist/:path*`,
        },
        // Map everything under /stake to the Post Service
        {
          source: "/stake/:path*",
          destination: `${postUrl}/stake/:path*`,
        },
      ],
    };
  },
};

export default withBaseConfig(nextConfig, "https://api.funstakes.net");
