/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => {
    return "funstakes-build";
  },

  async rewrites() {
    return [
      // 1. Backend API Rewrite (Formerly in vercel.json)
      {
        source: "/api/:path*",
        destination: "https://funstakes.onrender.com/:path*",
      },
      // 2. Auth Microservice
      {
        source: "/login",
        destination: `${process.env.NEXT_PUBLIC_AUTH_URL}/login`,
      },
      {
        source: "/signup",
        destination: `${process.env.NEXT_PUBLIC_AUTH_URL}/signup`,
      },
      {
        // This forwards the auth app's code to the browser
        source: "/_next/static/:path*",
        destination: `${process.env.NEXT_PUBLIC_AUTH_URL}/_next/static/:path*`,
      },
      // 3. Gist Microservice
      {
        source: "/gist",
        destination: `${process.env.NEXT_PUBLIC_GIST_URL}/gist`,
      },
      // 4. Profile Microservice
      {
        source: "/profile",
        destination: `${process.env.NEXT_PUBLIC_PROFILE_URL}/profile`,
      },
      // 5. Stake Microservice
      {
        source: "/stake",
        destination: `${process.env.NEXT_PUBLIC_STAKE_URL}/stake`,
      },
      // 6. Marketing / Web Microservice
      {
        source: "/about",
        destination: `${process.env.NEXT_PUBLIC_WEB_URL}/about`,
      },
      {
        source: "/pricing",
        destination: `${process.env.NEXT_PUBLIC_WEB_URL}/pricing`,
      },
      {
        source: "/support",
        destination: `${process.env.NEXT_PUBLIC_WEB_URL}/support`,
      },
    ];
  },
};

export default nextConfig;
