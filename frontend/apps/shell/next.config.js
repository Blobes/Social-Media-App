/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@repo/shared-ui",
    "@repo/shared-state",
    "@repo/helpers",
    "@repo/theme",
    "@repo/types",
    "@repo/auth/shared",
    "@repo/gist/shared",
    "@repo/stake/shared",
    "@repo/profile/shared",
  ],
  async rewrites() {
    const isProd = process.env.NODE_ENV === "production";

    // Helper to determine the target base URL
    // Locally: Uses the ports you defined
    // Production: Uses the environment variables you set in Vercel Dashboard
    const getTarget = (envVar, localPort) => {
      if (isProd) {
        return envVar;
      }
      return `http://localhost:${localPort}`;
    };

    return [
      // 1. Backend API Rewrite (Formerly in vercel.json)
      {
        source: "/api/:path*",
        destination: "https://funstakes.onrender.com/:path*",
      },
      // 2. Auth Microservice
      {
        source: "/login",
        destination: `${getTarget(process.env.NEXT_PUBLIC_AUTH_URL, 3002)}/login`,
      },
      {
        source: "/signup",
        destination: `${getTarget(process.env.NEXT_PUBLIC_AUTH_URL, 3002)}/signup`,
      },
      // 3. Gist Microservice
      {
        source: "/gist/:path*",
        destination: `${getTarget(process.env.NEXT_PUBLIC_GIST_URL, 3003)}/gist/:path*`,
      },
      // 4. Profile Microservice
      {
        source: "/profile/:path*",
        destination: `${getTarget(process.env.NEXT_PUBLIC_PROFILE_URL, 3004)}/profile/:path*`,
      },
      // 5. Stake Microservice
      {
        source: "/stake/:path*",
        destination: `${getTarget(process.env.NEXT_PUBLIC_STAKE_URL, 3005)}/stake/:path*`,
      },
      // 6. Marketing / Web Microservice
      {
        source: "/about",
        destination: `${getTarget(process.env.NEXT_PUBLIC_WEB_URL, 3006)}/about`,
      },
      {
        source: "/pricing",
        destination: `${getTarget(process.env.NEXT_PUBLIC_WEB_URL, 3006)}/pricing`,
      },
      {
        source: "/support",
        destination: `${getTarget(process.env.NEXT_PUBLIC_WEB_URL, 3006)}/support`,
      },
    ];
  },
};

export default nextConfig;
