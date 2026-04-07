import { withBaseConfig } from "@repo/env-config/next-config";

const nextConfig = {
  async rewrites() {
    const authUrl = authUrl || "http://auth-app:3002";
    const postUrl = postUrl || "http://post-app:3003";
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
