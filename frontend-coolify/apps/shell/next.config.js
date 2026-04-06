import { withBaseConfig } from "@repo/env-config/next-config";

const nextConfig = {
  async rewrites() {
    return {
      afterFiles: [
        // Map the Shell's /login to the Auth Service
        {
          source: "/login",
          destination: `${process.env.AUTH_URL}/login`,
        },
        {
          source: "/signup",
          destination: `${process.env.AUTH_URL}/signup`,
        },
        // Map everything under /gist to the Post Service
        {
          source: "/gist/:path*",
          destination: `${process.env.POST_URL}/gist/:path*`,
        },
        // Map everything under /stake to the Post Service
        {
          source: "/stake/:path*",
          destination: `${process.env.POST_URL}/stake/:path*`,
        },
      ],
    };
  },
};

export default withBaseConfig(nextConfig, "https://api.funstakes.net");
