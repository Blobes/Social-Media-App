import { withBaseConfig, mapAppAssets } from "@repo/core/next-config";

const nextConfig = {
  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";

    const authUrl = isDev ? "http://localhost:3002" : "http://auth-app:3002";
    const postUrl = isDev ? "http://localhost:3003" : "http://post-app:3003";

    return {
      beforeFiles: [
        // Automatically map assets for all apps
        ...mapAppAssets({
          auth: authUrl,
          post: postUrl,
        }),
      ],
      afterFiles: [
        // Auth app
        { source: "/login", destination: `${authUrl}/login` },
        { source: "/signup", destination: `${authUrl}/signup` },
        {
          source: "/verify-identity",
          destination: `${authUrl}/verify-identity`,
        },
        { source: "/reset-password", destination: `${authUrl}/reset-password` },
        { source: "/onboarding", destination: `${authUrl}/signup/onboarding` },
        // Gist app
        { source: "/gist", destination: `${postUrl}/gist/detail` },
        { source: "/gists", destination: `${postUrl}/gist/feed` },
        { source: "/gist/:path*", destination: `${postUrl}/gist/:path*` },
        // Stake app
        { source: "/stake", destination: `${postUrl}/stake/detail` },
        { source: "/stake/:path*", destination: `${postUrl}/stake/:path*` },
      ],
    };
  },
};

export default withBaseConfig(nextConfig, "https://api.funstakes.net", "shell");
