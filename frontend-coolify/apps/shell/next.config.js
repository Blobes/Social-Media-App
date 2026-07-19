import { withBaseConfig, mapAppAssets } from "@repo/core/next-config";

const nextConfig = {
  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";

    // Browsers need to see localhost:PORT, while Docker-to-Docker needs service:PORT
    const authUrl =
      process.env.AUTH_URL ||
      (isDev ? "http://localhost:3002" : "http://auth-app:3002");
    const postUrl =
      process.env.POST_URL ||
      (isDev ? "http://localhost:3003" : "http://post-app:3003");

    return {
      beforeFiles: [
        // Automatically map assets for all apps
        ...mapAppAssets({
          auth: authUrl,
          post: postUrl,
        }),
      ],
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
        {
          source: "/verify-otp",
          destination: `${authUrl}/otp`,
        },
        {
          source: "/reset-password",
          destination: `${authUrl}/password/reset`,
        },
        {
          source: "/onboarding",
          destination: `${authUrl}/signup/onboarding`,
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

export default withBaseConfig(nextConfig, "https://api.funstakes.net", "shell");
